import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { parts: true } } },
    orderBy: { name: "asc" },
  });
  return Response.json(suppliers);
}

export async function POST(request: NextRequest) {
  try {
    const { name, url, email } = await request.json();
    if (!name) {
      return Response.json({ error: "Nazwa jest wymagana" }, { status: 400 });
    }
    const supplier = await prisma.supplier.create({
      data: { name, url: url || null, email: email || null },
    });
    return Response.json(supplier, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Błąd tworzenia dostawcy" }, { status: 500 });
  }
}
