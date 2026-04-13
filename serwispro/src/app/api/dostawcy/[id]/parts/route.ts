import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: supplierId } = await params;
  try {
    const { partId, price, url, inStock } = await request.json();
    if (!partId || price === undefined) {
      return Response.json(
        { error: "partId i price są wymagane" },
        { status: 400 }
      );
    }
    const supplierPart = await prisma.supplierPart.create({
      data: {
        supplierId,
        partId,
        price,
        url: url || null,
        inStock: inStock ?? true,
      },
      include: { part: true },
    });
    return Response.json(supplierPart, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return Response.json(
        { error: "Ta część jest już przypisana do tego dostawcy" },
        { status: 409 }
      );
    }
    console.error(error);
    return Response.json({ error: "Błąd dodawania części" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const { supplierPartId } = await request.json();
    await prisma.supplierPart.delete({ where: { id: supplierPartId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Nie znaleziono mapowania" }, { status: 404 });
  }
}
