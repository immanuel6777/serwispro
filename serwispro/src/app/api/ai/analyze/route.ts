import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeRepair } from "@/lib/ai";
import { buildRepairContext, formatContextForPrompt } from "@/lib/ai-context";

export async function POST(request: Request) {
  try {
    const { bikeId, problemDesc, repairId } = (await request.json()) as {
      bikeId: string;
      problemDesc: string;
      repairId?: string;
    };

    if (!bikeId || !problemDesc) {
      return NextResponse.json(
        { error: "bikeId i problemDesc są wymagane" },
        { status: 400 }
      );
    }

    const context = await buildRepairContext(bikeId);
    const contextString = formatContextForPrompt(context);

    const { diagnosis, estimate, email } = await analyzeRepair(
      contextString,
      problemDesc
    );

    // If repairId provided, update the repair with AI results
    if (repairId) {
      await prisma.repair.update({
        where: { id: repairId },
        data: {
          aiDiagnosis: diagnosis as object,
          aiEstimate: estimate as object,
          aiEmail: email as object,
          laborCost: estimate.laborCost,
          totalCost: estimate.totalCost,
          status: "DIAGNOSED",
        },
      });
    }

    return NextResponse.json({ diagnosis, estimate, email });
  } catch (error) {
    console.error("AI analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Błąd analizy AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
