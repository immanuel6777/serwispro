import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: { select: { bikes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { name, email, phone, bikes } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json(
      { error: "Nazwa klienta jest wymagana" },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      bikes:
        bikes && Array.isArray(bikes) && bikes.length > 0
          ? {
              create: bikes.map(
                (bike: {
                  brand: string;
                  model: string;
                  year?: number;
                  type: string;
                }) => ({
                  brand: bike.brand,
                  model: bike.model,
                  year: bike.year || null,
                  type: bike.type,
                })
              ),
            }
          : undefined,
    },
    include: {
      bikes: true,
    },
  });

  return Response.json(customer, { status: 201 });
}
