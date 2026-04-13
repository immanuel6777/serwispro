import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryAlert } from "@/components/inventory-alert";
import { PartForm } from "@/components/part-form";
import { MagazynSearch } from "./search";

interface InventoryData {
  quantity: number;
  minStock: number;
  location: string | null;
}

interface PartWithInventory {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  sku: string | null;
  defaultPrice: unknown;
  inventory: InventoryData | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  hamulce: "Hamulce",
  "napęd": "Napęd",
  "koła": "Koła",
  rama: "Rama",
  kierownica: "Kierownica",
  "siodło": "Siodło",
  "oświetlenie": "Oświetlenie",
  akcesoria: "Akcesoria",
  inne: "Inne",
};

const CATEGORY_TABS = [
  { label: "Wszystkie", value: "" },
  { label: "Hamulce", value: "hamulce" },
  { label: "Napęd", value: "napęd" },
  { label: "Koła", value: "koła" },
  { label: "Rama", value: "rama" },
  { label: "Kierownica", value: "kierownica" },
  { label: "Siodło", value: "siodło" },
  { label: "Oświetlenie", value: "oświetlenie" },
  { label: "Akcesoria", value: "akcesoria" },
  { label: "Inne", value: "inne" },
];

export default async function MagazynPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q, category } = await searchParams;
  const searchQuery = typeof q === "string" ? q : "";
  const categoryFilter = typeof category === "string" ? category : "";

  const where: Record<string, unknown> = {};

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { sku: { contains: searchQuery, mode: "insensitive" } },
      { brand: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (categoryFilter) {
    where.category = categoryFilter;
  }

  const parts = await prisma.part.findMany({
    where,
    include: { inventory: true },
    orderBy: { name: "asc" },
  });

  // Find low-stock items
  const lowStockItems = (parts as PartWithInventory[])
    .filter(
      (p: PartWithInventory) => p.inventory && p.inventory.quantity < p.inventory.minStock
    )
    .map((p: PartWithInventory) => ({
      name: p.name,
      quantity: p.inventory!.quantity,
      minStock: p.inventory!.minStock,
    }));

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Magazyn</h1>
          <p className="text-sm text-muted-foreground">
            Zarządzaj częściami i stanem magazynowym
          </p>
        </div>
        <PartForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Dodaj część
            </Button>
          }
        />
      </div>

      <InventoryAlert items={lowStockItems} />

      {/* Search */}
      <MagazynSearch defaultValue={searchQuery} category={categoryFilter} />

      {/* Category filter tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {CATEGORY_TABS.map((tab) => {
          const isActive = categoryFilter === tab.value;
          const params = new URLSearchParams();
          if (searchQuery) params.set("q", searchQuery);
          if (tab.value) params.set("category", tab.value);
          const href = params.toString()
            ? `/magazyn?${params.toString()}`
            : "/magazyn";

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Lista części
          </CardTitle>
          <CardDescription>
            Wyświetlono części: {parts.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Package className="size-10 opacity-40" />
              <p>Brak części w magazynie</p>
              <p className="text-xs">
                Dodaj pierwszą część klikając przycisk &quot;Dodaj część&quot;.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Marka</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                  <TableHead className="text-center">Ilość</TableHead>
                  <TableHead className="text-center">Min. stan</TableHead>
                  <TableHead>Lokalizacja</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => {
                  const qty = part.inventory?.quantity ?? 0;
                  const min = part.inventory?.minStock ?? 2;
                  const isLow = qty < min;
                  const isEmpty = qty === 0;

                  return (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">
                        {part.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {CATEGORY_LABELS[part.category] || part.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.brand || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {part.sku || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(part.defaultPrice).toFixed(2)} zł
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                            isEmpty
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              : isLow
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          )}
                        >
                          {qty}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {min}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.inventory?.location || "—"}
                      </TableCell>
                      <TableCell>
                        <PartForm
                          part={{
                            id: part.id,
                            name: part.name,
                            category: part.category,
                            brand: part.brand,
                            sku: part.sku,
                            defaultPrice: Number(part.defaultPrice),
                            inventory: part.inventory,
                          }}
                          trigger={
                            <Button variant="ghost" size="sm">
                              Edytuj
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
