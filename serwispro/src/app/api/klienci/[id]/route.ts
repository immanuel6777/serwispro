import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bikes: {
        include: {
          repairs: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!customer) {
    return Response.json(
      { error: "Nie znaleziono klienta" },
      { status: 404 }
    );
  }

  return Response.json(customer);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { name, email, phone } = body;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
    },
    include: {
      bikes: true,
    },
  });

  return Response.json(customer);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.customer.delete({ where: { id } });

  return Response.json({ success: true });
}
