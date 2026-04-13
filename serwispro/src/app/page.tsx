import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  Package,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  ACCEPTED: "Przyjęta",
  DIAGNOSED: "Zdiagnozowana",
  WAITING_APPROVAL: "Oczekuje na akceptację",
  WAITING_PARTS: "Oczekuje na części",
  IN_PROGRESS: "W naprawie",
  READY: "Gotowa do odbioru",
  COMPLETED: "Zakończona",
};

export default async function Dashboard() {
  const [repairs, recentRepairs, allInventory] = await Promise.all([
    prisma.repair.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.repair.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        bike: { include: { customer: true } },
      },
    }),
    prisma.inventory.findMany({
      include: { part: true },
    }),
  ]);

  const lowStock = allInventory.filter((i) => i.quantity <= i.minStock);

  const statusCounts = Object.fromEntries(
    repairs.map((r) => [r.status, r._count.id])
  );

  const activeCount =
    (statusCounts.ACCEPTED || 0) +
    (statusCounts.DIAGNOSED || 0) +
    (statusCounts.WAITING_APPROVAL || 0) +
    (statusCounts.WAITING_PARTS || 0) +
    (statusCounts.IN_PROGRESS || 0);

  const readyCount = statusCounts.READY || 0;
  const completedCount = statusCounts.COMPLETED || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Przegląd serwisu rowerowego
          </p>
        </div>
        <Link href="/naprawy/nowa">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nowa naprawa
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywne naprawy</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount + readyCount}</div>
            <p className="text-xs text-muted-foreground">
              {statusCounts.IN_PROGRESS || 0} w trakcie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oczekujące</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statusCounts.WAITING_APPROVAL || 0) + (statusCounts.WAITING_PARTS || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusCounts.WAITING_PARTS || 0} czeka na części
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gotowe do odbioru</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyCount}</div>
            <p className="text-xs text-muted-foreground">
              {completedCount} zakończonych łącznie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerty magazynowe</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground">niski stan części</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie naprawy</CardTitle>
            <CardDescription>Najnowsze zlecenia w serwisie</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRepairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak napraw w systemie</p>
            ) : (
              <div className="space-y-4">
                {recentRepairs.map((repair) => (
                  <Link
                    key={repair.id}
                    href={`/naprawy/${repair.id}`}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {repair.bike.brand} {repair.bike.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {repair.bike.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {repair.problemDesc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[repair.status] || repair.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/naprawy">
                <Button variant="outline" className="w-full">
                  Zobacz wszystkie naprawy
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerty magazynowe</CardTitle>
            <CardDescription>Części z niskim stanem</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  Wszystkie części w normie
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{inv.part.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.part.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={inv.quantity === 0 ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {inv.quantity} / {inv.minStock} min
                      </Badge>
                      {inv.quantity === 0 && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/magazyn">
                <Button variant="outline" className="w-full">
                  Zarządzaj magazynem
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
