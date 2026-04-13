import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { RepairStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");

    const where = status
      ? { status: status as RepairStatus }
      : {};

    const repairs = await prisma.repair.findMany({
      where,
      include: {
        bike: {
          include: { customer: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(repairs);
  } catch (error) {
    console.error("GET /api/naprawy error:", error);
    return Response.json(
      { error: "Nie udało się pobrać napraw" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bikeId, problemDesc } = body;

    if (!bikeId || !problemDesc) {
      return Response.json(
        { error: "bikeId i problemDesc są wymagane" },
        { status: 400 }
      );
    }

    const bike = await prisma.bike.findUnique({ where: { id: bikeId } });
    if (!bike) {
      return Response.json(
        { error: "Nie znaleziono roweru" },
        { status: 404 }
      );
    }

    const repair = await prisma.repair.create({
      data: { bikeId, problemDesc },
      include: {
        bike: {
          include: { customer: true },
        },
      },
    });

    return Response.json(repair, { status: 201 });
  } catch (error) {
    console.error("POST /api/naprawy error:", error);
    return Response.json(
      { error: "Nie udało się utworzyć naprawy" },
      { status: 500 }
    );
  }
}
