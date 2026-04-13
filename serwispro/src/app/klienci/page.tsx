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
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/components/customer-form";
import { Users, Bike, ChevronRight } from "lucide-react";

export default async function KlienciPage() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: { select: { bikes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Klienci</h1>
          <p className="text-sm text-muted-foreground">
            Zarzadzaj baza klientow serwisu
          </p>
        </div>
        <CustomerForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Lista klientow
          </CardTitle>
          <CardDescription>
            Wszystkich klientow: {customers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Users className="size-10 opacity-40" />
              <p>Brak klientow</p>
              <p className="text-xs">
                Dodaj pierwszego klienta klikajac przycisk powyzej.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imie i nazwisko</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-center">Rowery</TableHead>
                  <TableHead>Dodano</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: typeof customers[number]) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/klienci/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.phone || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Bike className="size-3" />
                        {customer._count.bikes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString("pl-PL")}
                    </TableCell>
                    <TableCell>
                      <Link href={`/klienci/${customer.id}`}>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
