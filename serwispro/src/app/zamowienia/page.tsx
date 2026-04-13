import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { OrdersClient } from "./orders-client";

type EstimatePart = { name: string; quantity: number; unitPrice: number; inStock: boolean };
type AiEstimate = { parts?: EstimatePart[] };

export default async function ZamowieniaPage() {
  // Parts needed by active repairs but not in stock
  const activeRepairs = await prisma.repair.findMany({
    where: {
      status: { in: ["ACCEPTED", "DIAGNOSED", "WAITING_APPROVAL", "WAITING_PARTS", "IN_PROGRESS"] },
      aiEstimate: { not: Prisma.JsonNull },
    },
    select: { id: true, aiEstimate: true, bike: { select: { brand: true, model: true, customer: { select: { name: true } } } } },
  });

  const missingFromRepairs: { partName: string; quantity: number; price: number; repairInfo: string }[] = [];
  for (const r of activeRepairs) {
    const est = r.aiEstimate as AiEstimate | null;
    if (!est?.parts) continue;
    for (const p of est.parts) {
      if (!p.inStock) {
        missingFromRepairs.push({
          partName: p.name,
          quantity: p.quantity,
          price: p.unitPrice,
          repairInfo: `${r.bike.brand} ${r.bike.model} — ${r.bike.customer.name}`,
        });
      }
    }
  }

  const allInventory = await prisma.inventory.findMany({
    include: {
      part: {
        include: {
          suppliers: {
            include: { supplier: true },
            orderBy: { price: "asc" },
          },
        },
      },
    },
  });

  const lowStock = allInventory
    .filter((i) => i.quantity <= i.minStock)
    .map((i) => ({
      partId: i.part.id,
      partName: i.part.name,
      category: i.part.category,
      currentQty: i.quantity,
      minStock: i.minStock,
      neededQty: i.minStock - i.quantity + 2,
      suppliers: i.part.suppliers.map((sp) => ({
        supplierName: sp.supplier.name,
        price: Number(sp.price),
        inStock: sp.inStock,
        url: sp.url,
      })),
      cheapestPrice: i.part.suppliers.length > 0
        ? Math.min(...i.part.suppliers.filter(s => s.inStock).map((s) => Number(s.price)))
        : null,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Zamówienia</h1>
        <p className="text-muted-foreground">
          Lista zakupów i sugestie uzupełnienia magazynu
        </p>
      </div>

      {/* Low stock summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Części do zamówienia
          </CardTitle>
          <CardDescription>
            Części poniżej minimalnego stanu magazynowego
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Wszystkie części mają wystarczający stan magazynowy.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Część</th>
                    <th className="pb-2">Kategoria</th>
                    <th className="pb-2 text-center">Stan</th>
                    <th className="pb-2 text-center">Minimum</th>
                    <th className="pb-2 text-center">Do zamówienia</th>
                    <th className="pb-2 text-right">Najtaniej</th>
                    <th className="pb-2">Dostawcy</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.partId} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.partName}</td>
                      <td className="py-2 text-muted-foreground">
                        {item.category}
                      </td>
                      <td className="py-2 text-center">
                        <Badge
                          variant={item.currentQty === 0 ? "destructive" : "outline"}
                        >
                          {item.currentQty}
                        </Badge>
                      </td>
                      <td className="py-2 text-center">{item.minStock}</td>
                      <td className="py-2 text-center font-medium">
                        {item.neededQty}
                      </td>
                      <td className="py-2 text-right">
                        {item.cheapestPrice !== null && isFinite(item.cheapestPrice)
                          ? `${item.cheapestPrice.toFixed(2)} zł`
                          : "-"}
                      </td>
                      <td className="py-2">
                        {item.suppliers.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {item.suppliers.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {s.supplierName}: {s.price.toFixed(2)} zł
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Brak dostawców
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parts missing from active repairs */}
      {missingFromRepairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Części potrzebne do aktywnych napraw
            </CardTitle>
            <CardDescription>
              Te części zostały zdiagnozowane przez AI ale nie ma ich w magazynie — blokują naprawy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Część</th>
                    <th className="pb-2 text-center">Ilość</th>
                    <th className="pb-2 text-right">Szac. cena</th>
                    <th className="pb-2">Naprawa</th>
                  </tr>
                </thead>
                <tbody>
                  {missingFromRepairs.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.partName}</td>
                      <td className="py-2 text-center">{item.quantity} szt.</td>
                      <td className="py-2 text-right">{item.price.toFixed(2)} zł</td>
                      <td className="py-2 text-muted-foreground">{item.repairInfo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI suggestions */}
      <OrdersClient lowStockCount={lowStock.length} missingFromRepairsCount={missingFromRepairs.length} />
    </div>
  );
}
