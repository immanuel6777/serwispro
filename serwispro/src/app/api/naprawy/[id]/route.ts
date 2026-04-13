import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { RepairStatus, RepairPart, Part, Inventory } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repair = await prisma.repair.findUnique({
      where: { id },
      include: {
        bike: { include: { customer: true } },
        parts: { include: { part: true } },
        emails: true,
      },
    });

    if (!repair) {
      return Response.json(
        { error: "Nie znaleziono naprawy" },
        { status: 404 }
      );
    }

    return Response.json(repair);
  } catch (error) {
    console.error("GET /api/naprawy/[id] error:", error);
    return Response.json(
      { error: "Nie udało się pobrać naprawy" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.repair.findUnique({
      where: { id },
      include: { parts: { include: { part: { include: { inventory: true } } } } },
    });

    if (!existing) {
      return Response.json(
        { error: "Nie znaleziono naprawy" },
        { status: 404 }
      );
    }

    const { status, aiDiagnosis, aiEstimate, aiEmail, laborCost, totalCost, notes } = body;

    // When moving to IN_PROGRESS, check inventory for all parts
    if (status === RepairStatus.IN_PROGRESS && existing.status !== RepairStatus.IN_PROGRESS) {
      for (const rp of existing.parts) {
        const inv = rp.part.inventory;
        if (!inv || inv.quantity < rp.quantity) {
          return Response.json(
            {
              error: `Brak wystarczającej ilości części "${rp.part.name}" w magazynie (dostępne: ${inv?.quantity ?? 0}, potrzebne: ${rp.quantity})`,
            },
            { status: 409 }
          );
        }
      }
    }

    // When moving to COMPLETED, deduct parts from inventory
    if (status === RepairStatus.COMPLETED && existing.status !== RepairStatus.COMPLETED) {
      for (const rp of existing.parts) {
        const inv = rp.part.inventory;
        if (!inv || inv.quantity < rp.quantity) {
          return Response.json(
            {
              error: `Brak wystarczającej ilości części "${rp.part.name}" w magazynie (dostępne: ${inv?.quantity ?? 0}, potrzebne: ${rp.quantity})`,
            },
            { status: 409 }
          );
        }
      }

      // Deduct inventory in a transaction
      const deductions = existing.parts
        .filter((rp: { part: { inventory: Inventory | null } }) => rp.part.inventory !== null)
        .map((rp: { partId: string; quantity: number }) =>
          prisma.inventory.update({
            where: { partId: rp.partId },
            data: { quantity: { decrement: rp.quantity } },
          })
        );
      await prisma.$transaction(deductions);
    }

    const repair = await prisma.repair.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(aiDiagnosis !== undefined && { aiDiagnosis }),
        ...(aiEstimate !== undefined && { aiEstimate }),
        ...(aiEmail !== undefined && { aiEmail }),
        ...(laborCost !== undefined && { laborCost }),
        ...(totalCost !== undefined && { totalCost }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        bike: { include: { customer: true } },
        parts: { include: { part: true } },
        emails: true,
      },
    });

    return Response.json(repair);
  } catch (error) {
    console.error("PATCH /api/naprawy/[id] error:", error);
    return Response.json(
      { error: "Nie udało się zaktualizować naprawy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.repair.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Nie znaleziono naprawy" },
        { status: 404 }
      );
    }

    await prisma.repair.delete({ where: { id } });

    return Response.json({ message: "Naprawa usunięta" });
  } catch (error) {
    console.error("DELETE /api/naprawy/[id] error:", error);
    return Response.json(
      { error: "Nie udało się usunąć naprawy" },
      { status: 500 }
    );
  }
}
