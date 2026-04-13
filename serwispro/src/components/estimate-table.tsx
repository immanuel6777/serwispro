"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, Check, CheckCircle, Pencil, X, XCircle } from "lucide-react";
import { toast } from "sonner";

interface EstimatePart {
  name: string;
  quantity: number;
  unitPrice: number;
  inStock: boolean;
}

interface Estimate {
  parts: EstimatePart[];
  laborCost: number;
  totalCost: number;
  notes?: string;
}

interface EstimateTableProps {
  estimate: Estimate;
  repairId: string;
  onUpdate?: (estimate: Estimate) => void;
}

export function EstimateTable({
  estimate,
  repairId,
  onUpdate,
}: EstimateTableProps) {
  const [editing, setEditing] = useState(false);
  const [parts, setParts] = useState<EstimatePart[]>(estimate.parts);
  const [laborCost, setLaborCost] = useState(estimate.laborCost);
  const [saving, setSaving] = useState(false);

  const partsTotal = parts.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0
  );
  const totalCost = partsTotal + laborCost;

  function handlePartChange(
    index: number,
    field: "quantity" | "unitPrice",
    value: string
  ) {
    const numValue = parseFloat(value) || 0;
    setParts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: numValue } : p))
    );
  }

  function handleCancel() {
    setParts(estimate.parts);
    setLaborCost(estimate.laborCost);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updatedEstimate: Estimate = {
        parts,
        laborCost,
        totalCost,
        notes: estimate.notes,
      };

      const res = await fetch(`/api/naprawy/${repairId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiEstimate: updatedEstimate,
          laborCost,
          totalCost,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad zapisu");
      }

      toast.success("Wycena zaktualizowana");
      setEditing(false);
      onUpdate?.(updatedEstimate);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nie udalo sie zapisac wyceny"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Wycena
          </CardTitle>
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edytuj
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Anuluj
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa czesci</TableHead>
              <TableHead className="w-[80px] text-right">Ilosc</TableHead>
              <TableHead className="w-[120px] text-right">
                Cena jedn.
              </TableHead>
              <TableHead className="w-[120px] text-right">Suma</TableHead>
              <TableHead className="w-[100px] text-center">
                Dostepnosc
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{part.name}</TableCell>
                <TableCell className="text-right">
                  {editing ? (
                    <Input
                      type="number"
                      min={1}
                      value={part.quantity}
                      onChange={(e) =>
                        handlePartChange(index, "quantity", e.target.value)
                      }
                      className="h-8 w-16 text-right ml-auto"
                    />
                  ) : (
                    part.quantity
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editing ? (
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={part.unitPrice}
                      onChange={(e) =>
                        handlePartChange(index, "unitPrice", e.target.value)
                      }
                      className="h-8 w-24 text-right ml-auto"
                    />
                  ) : (
                    `${part.unitPrice.toFixed(2)} zl`
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {(part.quantity * part.unitPrice).toFixed(2)} zl
                </TableCell>
                <TableCell className="text-center">
                  {part.inStock ? (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Tak
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Brak
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Robocizna
              </TableCell>
              <TableCell className="text-right font-medium">
                {editing ? (
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={laborCost}
                    onChange={(e) =>
                      setLaborCost(parseFloat(e.target.value) || 0)
                    }
                    className="h-8 w-24 text-right ml-auto"
                  />
                ) : (
                  `${laborCost.toFixed(2)} zl`
                )}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right text-base font-bold">
                Razem
              </TableCell>
              <TableCell className="text-right text-base font-bold">
                {totalCost.toFixed(2)} zl
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>

        {estimate.notes && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium">Uwagi:</span> {estimate.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
