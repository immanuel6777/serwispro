import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        inventory: true,
        suppliers: {
          include: { supplier: true },
        },
      },
    });

    if (!part) {
      return Response.json(
        { error: "Nie znaleziono części" },
        { status: 404 }
      );
    }

    return Response.json(part);
  } catch (error) {
    console.error("GET /api/magazyn/[id] error:", error);
    return Response.json(
      { error: "Nie udało się pobrać części" },
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

    const existing = await prisma.part.findUnique({
      where: { id },
      include: { inventory: true },
    });

    if (!existing) {
      return Response.json(
        { error: "Nie znaleziono części" },
        { status: 404 }
      );
    }

    const { name, category, brand, sku, defaultPrice, quantity, minStock, location } = body;

    // Check SKU uniqueness if changing
    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.part.findUnique({ where: { sku } });
      if (skuExists) {
        return Response.json(
          { error: "Część o podanym SKU już istnieje" },
          { status: 409 }
        );
      }
    }

    const part = await prisma.part.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(brand !== undefined && { brand: brand || null }),
        ...(sku !== undefined && { sku: sku || null }),
        ...(defaultPrice !== undefined && { defaultPrice }),
      },
      include: { inventory: true },
    });

    // Update inventory if any inventory fields provided
    if (quantity !== undefined || minStock !== undefined || location !== undefined) {
      if (existing.inventory) {
        await prisma.inventory.update({
          where: { partId: id },
          data: {
            ...(quantity !== undefined && { quantity }),
            ...(minStock !== undefined && { minStock }),
            ...(location !== undefined && { location: location || null }),
          },
        });
      } else {
        await prisma.inventory.create({
          data: {
            partId: id,
            quantity: quantity ?? 0,
            minStock: minStock ?? 2,
            location: location || null,
          },
        });
      }
    }

    // Re-fetch with updated inventory
    const updated = await prisma.part.findUnique({
      where: { id },
      include: { inventory: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/magazyn/[id] error:", error);
    return Response.json(
      { error: "Nie udało się zaktualizować części" },
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

    const existing = await prisma.part.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Nie znaleziono części" },
        { status: 404 }
      );
    }

    await prisma.part.delete({ where: { id } });

    return Response.json({ message: "Część usunięta" });
  } catch (error) {
    console.error("DELETE /api/magazyn/[id] error:", error);
    return Response.json(
      { error: "Nie udało się usunąć części" },
      { status: 500 }
    );
  }
}
