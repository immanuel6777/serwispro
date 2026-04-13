import { prisma } from "@/lib/prisma";

export interface RepairContext {
  bike: {
    id: string;
    brand: string;
    model: string;
    year: number | null;
    type: string;
    customer: {
      name: string;
      email: string | null;
    };
  };
  repairHistory: {
    id: string;
    problemDesc: string;
    aiDiagnosis: unknown;
    totalCost: string | null;
    parts: { name: string; category: string; price: string }[];
  }[];
  inventory: {
    partName: string;
    category: string;
    brand: string | null;
    quantity: number;
    minStock: number;
    defaultPrice: string;
  }[];
}

export async function buildRepairContext(bikeId: string): Promise<RepairContext> {
  const bike = await prisma.bike.findUniqueOrThrow({
    where: { id: bikeId },
    include: { customer: true },
  });

  // Fetch last 10 completed repairs for same brand+model
  const repairHistory = await prisma.repair.findMany({
    where: {
      bike: {
        brand: bike.brand,
        model: bike.model,
      },
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      parts: {
        include: { part: true },
      },
    },
  });

  // Fetch full inventory (including zero-stock parts)
  const inventoryItems = await prisma.inventory.findMany({
    include: { part: true },
  });

  return {
    bike: {
      id: bike.id,
      brand: bike.brand,
      model: bike.model,
      year: bike.year,
      type: bike.type,
      customer: {
        name: bike.customer.name,
        email: bike.customer.email,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repairHistory: repairHistory.map((r: any) => ({
      id: r.id,
      problemDesc: r.problemDesc,
      aiDiagnosis: r.aiDiagnosis,
      totalCost: r.totalCost?.toString() ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parts: r.parts.map((rp: any) => ({
        name: rp.part.name,
        category: rp.part.category,
        price: rp.price.toString(),
      })),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inventory: inventoryItems.map((inv: any) => ({
      partName: inv.part.name,
      category: inv.part.category,
      brand: inv.part.brand,
      quantity: inv.quantity,
      minStock: inv.minStock,
      defaultPrice: inv.part.defaultPrice.toString(),
    })),
  };
}

export function formatContextForPrompt(ctx: RepairContext): string {
  const lines: string[] = [];

  lines.push(`### Rower`);
  lines.push(`- Marka: ${ctx.bike.brand}`);
  lines.push(`- Model: ${ctx.bike.model}`);
  if (ctx.bike.year) lines.push(`- Rocznik: ${ctx.bike.year}`);
  lines.push(`- Typ: ${ctx.bike.type}`);
  lines.push(`- Klient: ${ctx.bike.customer.name}`);
  if (ctx.bike.customer.email) lines.push(`- Email: ${ctx.bike.customer.email}`);

  if (ctx.repairHistory.length > 0) {
    lines.push(`\n### Historia napraw (${ctx.bike.brand} ${ctx.bike.model})`);
    for (const r of ctx.repairHistory) {
      lines.push(`- Problem: ${r.problemDesc}`);
      if (r.totalCost) lines.push(`  Koszt: ${r.totalCost} PLN`);
      if (r.parts.length > 0) {
        lines.push(`  Części: ${r.parts.map((p) => `${p.name} (${p.price} PLN)`).join(", ")}`);
      }
    }
  }

  if (ctx.inventory.length > 0) {
    lines.push(`\n### Stan magazynu (wszystkie części)`);
    for (const inv of ctx.inventory) {
      const status =
        inv.quantity === 0
          ? "BRAK NA STANIE"
          : inv.quantity <= inv.minStock
            ? `NISKI STAN (minimum: ${inv.minStock})`
            : "dostępna";
      lines.push(
        `- ${inv.partName} (${inv.category}${inv.brand ? `, ${inv.brand}` : ""}) — ${inv.quantity} szt. [${status}], cena: ${inv.defaultPrice} PLN`
      );
    }
  }

  return lines.join("\n");
}
