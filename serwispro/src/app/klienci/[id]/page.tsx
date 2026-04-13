import { notFound } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customer-form";
import { BikeForm } from "@/components/bike-form";
import { DeleteCustomerButton } from "@/components/delete-customer-button";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Bike,
  Wrench,
  Calendar,
} from "lucide-react";

type RepairRow = {
  id: string;
  status: string;
  problemDesc: string;
  totalCost: unknown;
  createdAt: Date;
};

type BikeRow = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  type: string;
  repairs: RepairRow[];
};

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Przyjety",
  DIAGNOSED: "Zdiagnozowany",
  WAITING_APPROVAL: "Oczekuje akceptacji",
  WAITING_PARTS: "Oczekuje na czesci",
  IN_PROGRESS: "W trakcie",
  READY: "Gotowy",
  COMPLETED: "Zakonczony",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ACCEPTED: "outline",
  DIAGNOSED: "secondary",
  WAITING_APPROVAL: "secondary",
  WAITING_PARTS: "secondary",
  IN_PROGRESS: "default",
  READY: "default",
  COMPLETED: "outline",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bikes: {
        include: {
          repairs: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link
          href="/klienci"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Powrot do listy
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Klient od{" "}
              {new Date(customer.createdAt).toLocaleDateString("pl-PL")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CustomerForm
              customer={{
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
              }}
              trigger={<Button variant="outline">Edytuj</Button>}
            />
            <DeleteCustomerButton customerId={customer.id} />
          </div>
        </div>
      </div>

      {/* Customer info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Dane klienta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Imie i nazwisko
                </p>
                <p className="font-medium">{customer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="font-medium">{customer.phone || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bikes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bike className="size-5" />
                Rowery ({customer.bikes.length})
              </CardTitle>
              <CardDescription>
                Lista rowerow klienta i historia napraw
              </CardDescription>
            </div>
            <BikeForm customerId={customer.id} />
          </div>
        </CardHeader>
        <CardContent>
          {customer.bikes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Bike className="size-10 opacity-40" />
              <p>Brak rowerow</p>
              <p className="text-xs">
                Dodaj rower klikajac przycisk powyzej.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {customer.bikes.map((bike: BikeRow) => (
                <div key={bike.id}>
                  <div className="mb-3 flex items-center gap-3">
                    <Badge variant="secondary" className="gap-1">
                      {bike.type}
                    </Badge>
                    <span className="font-medium">
                      {bike.brand} {bike.model}
                    </span>
                    {bike.year && (
                      <span className="text-sm text-muted-foreground">
                        ({bike.year})
                      </span>
                    )}
                  </div>

                  {bike.repairs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Opis problemu</TableHead>
                          <TableHead>Koszt</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bike.repairs.map((repair: RepairRow) => (
                          <TableRow key={repair.id}>
                            <TableCell>
                              <Badge
                                variant={
                                  STATUS_VARIANT[repair.status] || "outline"
                                }
                              >
                                {STATUS_LABELS[repair.status] || repair.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {repair.problemDesc}
                            </TableCell>
                            <TableCell>
                              {repair.totalCost
                                ? `${Number(repair.totalCost).toFixed(2)} zł`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {new Date(
                                  repair.createdAt
                                ).toLocaleDateString("pl-PL")}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="ml-2 text-sm text-muted-foreground">
                      <Wrench className="mr-1 inline size-3" />
                      Brak historii napraw
                    </p>
                  )}

                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
