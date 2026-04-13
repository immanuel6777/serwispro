import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Bike, User } from "lucide-react";
import { RepairDetailClient } from "./repair-detail-client";

export default async function RepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const repair = await prisma.repair.findUnique({
    where: { id },
    include: {
      bike: { include: { customer: true } },
      parts: { include: { part: true } },
      emails: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!repair) {
    notFound();
  }

  // Serialize for client components (Decimal -> number, Date -> string)
  const serializedRepair = {
    ...repair,
    laborCost: repair.laborCost ? Number(repair.laborCost) : null,
    totalCost: repair.totalCost ? Number(repair.totalCost) : null,
    createdAt: repair.createdAt.toISOString(),
    updatedAt: repair.updatedAt.toISOString(),
    parts: repair.parts.map((rp: any) => ({
      ...rp,
      price: Number(rp.price),
      part: {
        ...rp.part,
        defaultPrice: Number(rp.part.defaultPrice),
      },
    })),
    emails: repair.emails.map((e: any) => ({
      ...e,
      sentAt: e.sentAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/naprawy">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrot do listy napraw
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Naprawa #{repair.id.slice(-6).toUpperCase()}
            </h1>
            <StatusBadge status={repair.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Bike className="h-4 w-4" />
              {repair.bike.brand} {repair.bike.model}
              {repair.bike.year ? ` (${repair.bike.year})` : ""}
              {" - "}
              {repair.bike.type}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {repair.bike.customer.name}
              {repair.bike.customer.email
                ? ` (${repair.bike.customer.email})`
                : ""}
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Utworzono:{" "}
          {repair.createdAt.toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Problem description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opis problemu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{repair.problemDesc}</p>
          {repair.notes && (
            <>
              <Separator className="my-3" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Notatki
                </p>
                <p className="text-sm whitespace-pre-wrap">{repair.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Main content - client component handles AI panels + timeline + actions */}
      <RepairDetailClient repair={serializedRepair} />
    </div>
  );
}
