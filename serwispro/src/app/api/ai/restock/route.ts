import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/ai";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(_request: NextRequest) {
  try {
    // 1. All parts with inventory
    const allPartsWithInventory = await prisma.part.findMany({
      include: { inventory: true },
    });

    // Parts below minStock
    const belowMinStock = allPartsWithInventory.filter(
      (p) => p.inventory && p.inventory.quantity < p.inventory.minStock
    );

    // 2. Parts used in repairs in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRepairParts = await prisma.repairPart.findMany({
      where: {
        repair: {
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      include: {
        part: { include: { inventory: true } },
      },
    });

    // Aggregate usage per part
    const usageMap = new Map<string, { part: typeof recentRepairParts[0]["part"]; totalUsed: number }>();
    for (const rp of recentRepairParts) {
      const existing = usageMap.get(rp.partId);
      if (existing) {
        existing.totalUsed += rp.quantity;
      } else {
        usageMap.set(rp.partId, { part: rp.part, totalUsed: rp.quantity });
      }
    }

    // 3. Parts needed by active repairs (from AI estimates) that are not in stock
    const activeRepairs = await prisma.repair.findMany({
      where: {
        status: { in: ["ACCEPTED", "DIAGNOSED", "WAITING_APPROVAL", "WAITING_PARTS", "IN_PROGRESS"] },
        aiEstimate: { not: Prisma.JsonNull },
      },
      select: {
        id: true,
        status: true,
        aiEstimate: true,
        bike: { select: { brand: true, model: true } },
      },
    });

    type EstimatePart = { name: string; quantity: number; unitPrice: number; inStock: boolean };
    type AiEstimate = { parts?: EstimatePart[] };

    const missingPartsFromRepairs: { partName: string; quantity: number; estimatedPrice: number; repairInfo: string }[] = [];
    for (const r of activeRepairs) {
      const est = r.aiEstimate as AiEstimate | null;
      if (!est?.parts) continue;
      for (const p of est.parts) {
        if (!p.inStock) {
          missingPartsFromRepairs.push({
            partName: p.name,
            quantity: p.quantity,
            estimatedPrice: p.unitPrice,
            repairInfo: `${r.bike.brand} ${r.bike.model} (status: ${r.status})`,
          });
        }
      }
    }

    // 4. Current supplier prices
    const supplierParts = await prisma.supplierPart.findMany({
      include: {
        supplier: true,
        part: true,
      },
    });

    // Build context for AI
    const context = `## Stan magazynu - Części poniżej minimalnego stanu

${belowMinStock.length === 0 ? "Brak części poniżej minimalnego stanu." : belowMinStock.map((p) => `- ${p.name} (${p.category}): stan ${p.inventory?.quantity ?? 0}/${p.inventory?.minStock ?? 2}, lokalizacja: ${p.inventory?.location || "brak"}`).join("\n")}

## Zużycie części w ostatnich 30 dniach

${usageMap.size === 0 ? "Brak zużycia części w ostatnich 30 dniach." : Array.from(usageMap.values()).map((u) => `- ${u.part.name} (${u.part.category}): zużyto ${u.totalUsed} szt., aktualny stan: ${u.part.inventory?.quantity ?? 0}/${u.part.inventory?.minStock ?? 2}`).join("\n")}

## Dostępni dostawcy i ceny

${supplierParts.length === 0 ? "Brak danych o dostawcach." : supplierParts.map((sp) => `- ${sp.part.name}: ${sp.supplier.name} - ${Number(sp.price).toFixed(2)} zł ${sp.inStock ? "(dostępna)" : "(niedostępna)"} ${sp.url ? sp.url : ""}`).join("\n")}

## Części potrzebne do aktywnych napraw, których BRAK w magazynie

${missingPartsFromRepairs.length === 0 ? "Brak brakujących części w aktywnych naprawach." : missingPartsFromRepairs.map((p) => `- ${p.partName}: ${p.quantity} szt. potrzebne (szac. ${p.estimatedPrice.toFixed(2)} zł/szt.) — naprawa: ${p.repairInfo}`).join("\n")}

## Wszystkie części w magazynie

${allPartsWithInventory.map((p) => `- ${p.name} (${p.category}, ${p.brand || "brak marki"}): cena ${Number(p.defaultPrice).toFixed(2)} zł, stan ${p.inventory?.quantity ?? 0}/${p.inventory?.minStock ?? 2}`).join("\n")}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "submit_restock_list",
          description:
            "Prześlij listę sugerowanych zamówień części do magazynu serwisu rowerowego.",
          input_schema: {
            type: "object" as const,
            properties: {
              suggestions: {
                type: "array",
                description: "Lista sugerowanych zamówień",
                items: {
                  type: "object",
                  properties: {
                    partName: {
                      type: "string",
                      description: "Nazwa części",
                    },
                    category: {
                      type: "string",
                      description: "Kategoria części",
                    },
                    currentStock: {
                      type: "number",
                      description: "Aktualny stan magazynowy",
                    },
                    minStock: {
                      type: "number",
                      description: "Minimalny wymagany stan",
                    },
                    suggestedQuantity: {
                      type: "number",
                      description: "Sugerowana ilość do zamówienia",
                    },
                    reason: {
                      type: "string",
                      description: "Uzasadnienie zamówienia",
                    },
                    estimatedCost: {
                      type: "number",
                      description: "Szacowany koszt zamówienia w PLN",
                    },
                    preferredSupplier: {
                      type: "string",
                      description: "Preferowany dostawca (jeśli dostępny)",
                    },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high", "critical"],
                      description: "Priorytet zamówienia",
                    },
                  },
                  required: [
                    "partName",
                    "category",
                    "currentStock",
                    "minStock",
                    "suggestedQuantity",
                    "reason",
                    "estimatedCost",
                    "priority",
                  ],
                },
              },
              summary: {
                type: "string",
                description: "Podsumowanie rekomendacji zakupowych",
              },
              totalEstimatedCost: {
                type: "number",
                description: "Łączny szacowany koszt wszystkich zamówień w PLN",
              },
            },
            required: ["suggestions", "summary", "totalEstimatedCost"],
          },
        },
      ],
      tool_choice: { type: "any" },
      messages: [
        {
          role: "user",
          content: `${context}\n\nNa podstawie powyższych danych przygotuj listę sugerowanych zamówień części. Uwzględnij:\n1. **KRYTYCZNE: Części potrzebne do aktywnych napraw, których brak w magazynie** — te muszą być na liście z priorytetem "critical" lub "high", bo blokują naprawy klientów\n2. Części poniżej minimalnego stanu magazynowego (priorytet wysoki)\n3. Części często używane w naprawach, które mogą się wkrótce wyczerpać\n4. Optymalne ilości zamówień (uwzględnij zużycie z ostatnich 30 dni)\n5. Najlepsze ceny od dostawców\n\nNawet jeśli część nie istnieje jeszcze w bazie magazynowej, ale jest potrzebna do naprawy — dodaj ją do listy.\n\nUżyj narzędzia submit_restock_list.`,
        },
      ],
    });

    // Extract tool result
    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "submit_restock_list") {
        return Response.json(block.input);
      }
    }

    return Response.json(
      { error: "AI nie zwróciło sugestii uzupełnienia magazynu" },
      { status: 500 }
    );
  } catch (error) {
    console.error("POST /api/ai/restock error:", error);
    return Response.json(
      { error: "Nie udało się wygenerować sugestii uzupełnienia" },
      { status: 500 }
    );
  }
}
