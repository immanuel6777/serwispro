import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { partId, quantity, price } = body;

    if (!partId || !quantity || price === undefined) {
      return Response.json(
        { error: "partId, quantity i price są wymagane" },
        { status: 400 }
      );
    }

    const repair = await prisma.repair.findUnique({ where: { id } });
    if (!repair) {
      return Response.json(
        { error: "Nie znaleziono naprawy" },
        { status: 404 }
      );
    }

    const part = await prisma.part.findUnique({ where: { id: partId } });
    if (!part) {
      return Response.json(
        { error: "Nie znaleziono części" },
        { status: 404 }
      );
    }

    const repairPart = await prisma.repairPart.create({
      data: {
        repairId: id,
        partId,
        quantity,
        price,
      },
      include: { part: true },
    });

    return Response.json(repairPart, { status: 201 });
  } catch (error) {
    console.error("POST /api/naprawy/[id]/parts error:", error);
    return Response.json(
      { error: "Nie udało się dodać części" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { repairPartId } = await request.json();

    if (!repairPartId) {
      return Response.json(
        { error: "repairPartId jest wymagane" },
        { status: 400 }
      );
    }

    const repairPart = await prisma.repairPart.findUnique({
      where: { id: repairPartId },
    });

    if (!repairPart || repairPart.repairId !== id) {
      return Response.json(
        { error: "Nie znaleziono części w tej naprawie" },
        { status: 404 }
      );
    }

    await prisma.repairPart.delete({ where: { id: repairPartId } });

    return Response.json({ message: "Część usunięta z naprawy" });
  } catch (error) {
    console.error("DELETE /api/naprawy/[id]/parts error:", error);
    return Response.json(
      { error: "Nie udało się usunąć części" },
      { status: 500 }
    );
  }
}
