import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SupplierForm } from "@/components/supplier-form";
import { SupplierPartForm } from "@/components/supplier-part-form";
import { SupplierActions } from "./supplier-actions";

export default async function UstawieniaPage() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      parts: { include: { part: true }, orderBy: { part: { name: "asc" } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ustawienia</h1>
        <p className="text-muted-foreground">
          Zarządzanie dostawcami i cenami części
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dostawcy</CardTitle>
            <CardDescription>
              Hurtownie rowerowe i mapowanie cen części
            </CardDescription>
          </div>
          <SupplierForm />
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak dostawców. Dodaj pierwszego dostawcę.
            </p>
          ) : (
            <div className="space-y-6">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{supplier.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {supplier.url && (
                          <a
                            href={supplier.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {supplier.url}
                          </a>
                        )}
                        {supplier.email && <span>{supplier.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {supplier.parts.length} części
                      </Badge>
                      <SupplierPartForm supplierId={supplier.id} />
                      <SupplierForm
                        supplier={supplier}
                        trigger={
                          <button className="text-sm text-muted-foreground hover:text-foreground">
                            Edytuj
                          </button>
                        }
                      />
                      <SupplierActions supplierId={supplier.id} />
                    </div>
                  </div>

                  {supplier.parts.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="pb-2">Część</th>
                              <th className="pb-2">Kategoria</th>
                              <th className="pb-2 text-right">Cena</th>
                              <th className="pb-2 text-center">Dostępna</th>
                              <th className="pb-2">Link</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplier.parts.map((sp) => (
                              <tr key={sp.id} className="border-b last:border-0">
                                <td className="py-2">{sp.part.name}</td>
                                <td className="py-2 text-muted-foreground">
                                  {sp.part.category}
                                </td>
                                <td className="py-2 text-right font-medium">
                                  {Number(sp.price).toFixed(2)} zł
                                </td>
                                <td className="py-2 text-center">
                                  <Badge
                                    variant={sp.inStock ? "outline" : "destructive"}
                                    className="text-xs"
                                  >
                                    {sp.inStock ? "Tak" : "Nie"}
                                  </Badge>
                                </td>
                                <td className="py-2">
                                  {sp.url && (
                                    <a
                                      href={sp.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      Link
                                    </a>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
