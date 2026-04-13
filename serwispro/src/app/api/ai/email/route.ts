import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { SYSTEM_PROMPT } from "@/lib/prompts";

const anthropic = new Anthropic();

const EMAIL_PROMPTS: Record<string, string> = {
  status: `Napisz email informujący klienta o aktualnym statusie naprawy roweru.
Bądź profesjonalny i zwięzły. Podaj jakie prace zostały wykonane i co jeszcze pozostało.
Podpisz się jako "Zespół SerwisPro".`,

  completion: `Napisz email informujący klienta, że naprawa roweru została zakończona i rower jest gotowy do odbioru.
Wymień wykonane prace i użyte części. Podaj finalny koszt.
Zaproś klienta do odbioru roweru. Podpisz się jako "Zespół SerwisPro".`,

  custom: `Napisz profesjonalny email do klienta w sprawie naprawy roweru.
Podpisz się jako "Zespół SerwisPro".`,
};

export async function POST(request: Request) {
  try {
    const { repairId, type, customMessage } = (await request.json()) as {
      repairId: string;
      type: "status" | "completion" | "custom";
      customMessage?: string;
    };

    if (!repairId || !type) {
      return NextResponse.json(
        { error: "repairId i type są wymagane" },
        { status: 400 }
      );
    }

    if (!["status", "completion", "custom"].includes(type)) {
      return NextResponse.json(
        { error: "type musi być: status, completion lub custom" },
        { status: 400 }
      );
    }

    const repair = await prisma.repair.findUniqueOrThrow({
      where: { id: repairId },
      include: {
        bike: { include: { customer: true } },
        parts: { include: { part: true } },
      },
    });

    const repairInfo = [
      `Klient: ${repair.bike.customer.name}`,
      `Rower: ${repair.bike.brand} ${repair.bike.model}`,
      `Status: ${repair.status}`,
      `Problem: ${repair.problemDesc}`,
      repair.totalCost ? `Koszt całkowity: ${repair.totalCost} PLN` : null,
      repair.notes ? `Notatki: ${repair.notes}` : null,
      repair.parts.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? `Części: ${repair.parts.map((rp: any) => `${rp.part.name} x${rp.quantity} (${rp.price} PLN)`).join(", ")}`
        : null,
      repair.aiDiagnosis
        ? `Diagnoza AI: ${JSON.stringify(repair.aiDiagnosis)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const emailPrompt = EMAIL_PROMPTS[type];
    const userMessage = `## Dane naprawy\n\n${repairInfo}\n\n## Instrukcja\n\n${emailPrompt}${
      type === "custom" && customMessage
        ? `\n\nDodatkowa wiadomość od serwisanta: ${customMessage}`
        : ""
    }\n\nUżyj narzędzia compose_email aby przesłać email.`;

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
          name: "compose_email",
          description: "Skomponuj email do klienta",
          input_schema: {
            type: "object" as const,
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              includesPriceTable: { type: "boolean" },
            },
            required: ["subject", "body", "includesPriceTable"],
          },
        },
      ],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: userMessage }],
    });

    let emailResult: { subject: string; body: string } | null = null;

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "compose_email") {
        const input = block.input as {
          subject: string;
          body: string;
          includesPriceTable: boolean;
        };
        emailResult = { subject: input.subject, body: input.body };
      }
    }

    if (!emailResult) {
      throw new Error("AI nie wygenerowało emaila");
    }

    return NextResponse.json(emailResult);
  } catch (error) {
    console.error("AI email error:", error);
    const message =
      error instanceof Error ? error.message : "Błąd generowania emaila";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
