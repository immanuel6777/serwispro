import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const anthropic = new Anthropic();

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: "submit_diagnosis",
    description:
      "Prześlij diagnozę problemu roweru. Zawiera podsumowanie, listę wykrytych problemów z komponentami i sugerowanymi częściami, szacowany czas pracy oraz pilność.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: {
          type: "string",
          description: "Krótkie podsumowanie diagnozy",
        },
        issues: {
          type: "array",
          description: "Lista wykrytych problemów",
          items: {
            type: "object",
            properties: {
              component: {
                type: "string",
                description: "Nazwa komponentu (np. hamulce, łańcuch, opona)",
              },
              problem: {
                type: "string",
                description: "Opis problemu",
              },
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "Waga problemu",
              },
              suggestedParts: {
                type: "array",
                description: "Sugerowane części do naprawy",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    category: { type: "string" },
                    estimatedPrice: {
                      type: "number",
                      description: "Szacowana cena w PLN",
                    },
                  },
                  required: ["name", "category", "estimatedPrice"],
                },
              },
            },
            required: ["component", "problem", "severity", "suggestedParts"],
          },
        },
        estimatedLaborMinutes: {
          type: "number",
          description: "Szacowany czas pracy w minutach",
        },
        urgency: {
          type: "string",
          enum: ["routine", "soon", "urgent"],
          description: "Pilność naprawy",
        },
      },
      required: ["summary", "issues", "estimatedLaborMinutes", "urgency"],
    },
  },
  {
    name: "submit_estimate",
    description:
      "Prześlij wycenę naprawy z listą części, kosztem robocizny i łącznym kosztem.",
    input_schema: {
      type: "object" as const,
      properties: {
        parts: {
          type: "array",
          description: "Lista części potrzebnych do naprawy",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unitPrice: {
                type: "number",
                description: "Cena jednostkowa w PLN",
              },
              inStock: {
                type: "boolean",
                description: "Czy część jest dostępna w magazynie",
              },
            },
            required: ["name", "quantity", "unitPrice", "inStock"],
          },
        },
        laborCost: {
          type: "number",
          description: "Koszt robocizny w PLN",
        },
        totalCost: {
          type: "number",
          description: "Łączny koszt naprawy w PLN",
        },
        notes: {
          type: "string",
          description: "Dodatkowe uwagi do wyceny",
        },
      },
      required: ["parts", "laborCost", "totalCost"],
    },
  },
  {
    name: "compose_email",
    description:
      "Skomponuj profesjonalny email do klienta w języku polskim z informacją o diagnozie i wycenie.",
    input_schema: {
      type: "object" as const,
      properties: {
        subject: {
          type: "string",
          description: "Temat emaila",
        },
        body: {
          type: "string",
          description: "Treść emaila w języku polskim",
        },
        includesPriceTable: {
          type: "boolean",
          description: "Czy email zawiera tabelę z cenami",
        },
      },
      required: ["subject", "body", "includesPriceTable"],
    },
  },
];

interface DiagnosisResult {
  summary: string;
  issues: {
    component: string;
    problem: string;
    severity: "low" | "medium" | "high" | "critical";
    suggestedParts: { name: string; category: string; estimatedPrice: number }[];
  }[];
  estimatedLaborMinutes: number;
  urgency: "routine" | "soon" | "urgent";
}

interface EstimateResult {
  parts: { name: string; quantity: number; unitPrice: number; inStock: boolean }[];
  laborCost: number;
  totalCost: number;
  notes?: string;
}

interface EmailResult {
  subject: string;
  body: string;
  includesPriceTable: boolean;
}

export interface AnalyzeRepairResult {
  diagnosis: DiagnosisResult;
  estimate: EstimateResult;
  email: EmailResult;
}

export async function analyzeRepair(
  context: string,
  problemDesc: string
): Promise<AnalyzeRepairResult> {
  const results: Partial<AnalyzeRepairResult> = {};

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: AI_TOOLS,
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: `## Kontekst serwisu\n\n${context}\n\n## Opis problemu zgłoszony przez klienta\n\n${problemDesc}\n\nPrzeanalizuj problem i użyj WSZYSTKICH trzech narzędzi: submit_diagnosis, submit_estimate, compose_email.`,
      },
    ],
  });

  // Process tool use blocks from response
  for (const block of response.content) {
    if (block.type === "tool_use") {
      switch (block.name) {
        case "submit_diagnosis":
          results.diagnosis = block.input as DiagnosisResult;
          break;
        case "submit_estimate":
          results.estimate = block.input as EstimateResult;
          break;
        case "compose_email":
          results.email = block.input as EmailResult;
          break;
      }
    }
  }

  // If not all tools were called in first response, continue the conversation
  if (!results.diagnosis || !results.estimate || !results.email) {
    const toolResults = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((b) => ({
        type: "tool_result" as const,
        tool_use_id: b.id,
        content: "OK. Kontynuuj i użyj pozostałych narzędzi.",
      }));

    const followUp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: AI_TOOLS,
      tool_choice: { type: "any" },
      messages: [
        {
          role: "user",
          content: `## Kontekst serwisu\n\n${context}\n\n## Opis problemu zgłoszony przez klienta\n\n${problemDesc}\n\nPrzeanalizuj problem i użyj WSZYSTKICH trzech narzędzi: submit_diagnosis, submit_estimate, compose_email.`,
        },
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ],
    });

    for (const block of followUp.content) {
      if (block.type === "tool_use") {
        switch (block.name) {
          case "submit_diagnosis":
            if (!results.diagnosis) results.diagnosis = block.input as DiagnosisResult;
            break;
          case "submit_estimate":
            if (!results.estimate) results.estimate = block.input as EstimateResult;
            break;
          case "compose_email":
            if (!results.email) results.email = block.input as EmailResult;
            break;
        }
      }
    }
  }

  if (!results.diagnosis || !results.estimate || !results.email) {
    throw new Error(
      "AI nie zwróciło wszystkich wymaganych wyników. " +
        `Brakuje: ${[
          !results.diagnosis && "diagnosis",
          !results.estimate && "estimate",
          !results.email && "email",
        ]
          .filter(Boolean)
          .join(", ")}`
    );
  }

  return results as AnalyzeRepairResult;
}
