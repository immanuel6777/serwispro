import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { brand, model, year, type } = body;

  if (!brand || !model || !type) {
    return Response.json(
      { error: "Marka, model i typ roweru są wymagane" },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    return Response.json(
      { error: "Nie znaleziono klienta" },
      { status: 404 }
    );
  }

  const bike = await prisma.bike.create({
    data: {
      brand: brand.trim(),
      model: model.trim(),
      year: year ? parseInt(year, 10) : null,
      type,
      customerId: id,
    },
  });

  return Response.json(bike, { status: 201 });
}
