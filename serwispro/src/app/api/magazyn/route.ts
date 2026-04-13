import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") || "";
    const category = request.nextUrl.searchParams.get("category") || "";

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const parts = await prisma.part.findMany({
      where,
      include: { inventory: true },
      orderBy: { name: "asc" },
    });

    return Response.json(parts);
  } catch (error) {
    console.error("GET /api/magazyn error:", error);
    return Response.json(
      { error: "Nie udało się pobrać części" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, brand, sku, defaultPrice, quantity, minStock, location } = body;

    if (!name || !category || defaultPrice === undefined) {
      return Response.json(
        { error: "Nazwa, kategoria i cena domyślna są wymagane" },
        { status: 400 }
      );
    }

    if (sku) {
      const existing = await prisma.part.findUnique({ where: { sku } });
      if (existing) {
        return Response.json(
          { error: "Część o podanym SKU już istnieje" },
          { status: 409 }
        );
      }
    }

    const part = await prisma.part.create({
      data: {
        name,
        category,
        brand: brand || null,
        sku: sku || null,
        defaultPrice,
        inventory: {
          create: {
            quantity: quantity ?? 0,
            minStock: minStock ?? 2,
            location: location || null,
          },
        },
      },
      include: { inventory: true },
    });

    return Response.json(part, { status: 201 });
  } catch (error) {
    console.error("POST /api/magazyn error:", error);
    return Response.json(
      { error: "Nie udało się dodać części" },
      { status: 500 }
    );
  }
}
