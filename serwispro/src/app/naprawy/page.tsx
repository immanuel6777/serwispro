import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RepairStatus } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

const statusTabs = [
  { label: "Wszystkie", value: "" },
  { label: "Przyjęte", value: "ACCEPTED" },
  { label: "W trakcie", value: "DIAGNOSED,IN_PROGRESS" },
  { label: "Oczekujące", value: "WAITING_APPROVAL,WAITING_PARTS" },
  { label: "Gotowe", value: "READY" },
  { label: "Zakończone", value: "COMPLETED" },
];

export default async function NaprawyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { status } = await searchParams;
  const statusFilter = typeof status === "string" ? status : undefined;

  let where = {};
  if (statusFilter) {
    if (statusFilter.includes(",")) {
      const statuses = statusFilter.split(",") as RepairStatus[];
      where = { status: { in: statuses } };
    } else {
      where = { status: statusFilter as RepairStatus };
    }
  }

  const repairs = await prisma.repair.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      bike: { include: { customer: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Naprawy</h1>
          <p className="text-muted-foreground">
            Zarządzanie zleceniami serwisowymi
          </p>
        </div>
        <Link href="/naprawy/nowa">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nowa naprawa
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/naprawy?status=${tab.value}` : "/naprawy"}
          >
            <Badge
              variant={statusFilter === tab.value || (!statusFilter && !tab.value) ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {tab.label}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista napraw</CardTitle>
          <CardDescription>
            {repairs.length} {repairs.length === 1 ? "naprawa" : "napraw"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repairs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Brak napraw spełniających kryteria.
            </p>
          ) : (
            <div className="space-y-3">
              {repairs.map((repair) => (
                <Link
                  key={repair.id}
                  href={`/naprawy/${repair.id}`}
                  className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <StatusBadge status={repair.status} />
                    <div>
                      <p className="font-medium">
                        {repair.bike.brand} {repair.bike.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {repair.bike.customer.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {truncate(repair.problemDesc, 80)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      {repair.totalCost && (
                        <p className="font-medium">
                          {Number(repair.totalCost).toFixed(2)} zł
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(repair.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
