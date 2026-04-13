import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { parts: { include: { part: true } } },
  });
  if (!supplier) {
    return Response.json({ error: "Nie znaleziono dostawcy" }, { status: 404 });
  }
  return Response.json(supplier);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.url !== undefined && { url: data.url || null }),
        ...(data.email !== undefined && { email: data.email || null }),
      },
    });
    return Response.json(supplier);
  } catch {
    return Response.json({ error: "Nie znaleziono dostawcy" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.supplier.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Nie znaleziono dostawcy" }, { status: 404 });
  }
}
