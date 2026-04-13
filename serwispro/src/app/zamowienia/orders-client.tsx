"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  partName: string;
  category: string;
  currentStock: number;
  minStock: number;
  suggestedQuantity: number;
  reason: string;
  estimatedCost: number;
  preferredSupplier?: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface RestockResult {
  suggestions: Suggestion[];
  summary: string;
  totalEstimatedCost: number;
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

const priorityLabels: Record<string, string> = {
  critical: "Krytyczny",
  high: "Wysoki",
  medium: "Średni",
  low: "Niski",
};

export function OrdersClient({ lowStockCount, missingFromRepairsCount = 0 }: { lowStockCount: number; missingFromRepairsCount?: number }) {
  const needsAction = lowStockCount > 0 || missingFromRepairsCount > 0;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RestockResult | null>(null);

  async function generateSuggestions() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/restock", { method: "POST" });
      if (!res.ok) throw new Error();
      const data: RestockResult = await res.json();
      setResult(data);
      toast.success("Sugestie AI wygenerowane");
    } catch {
      toast.error("Błąd generowania sugestii AI");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Sugestie AI
          </CardTitle>
          <CardDescription>
            AI przeanalizuje zużycie i zaproponuje optymalną listę zakupów
          </CardDescription>
        </div>
        <Button
          onClick={generateSuggestions}
          disabled={loading || !needsAction}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizuję...
            </>
          ) : (
            "Generuj listę zakupów"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              {result.summary}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Priorytet</th>
                    <th className="pb-2">Część</th>
                    <th className="pb-2 text-center">Stan</th>
                    <th className="pb-2 text-center">Zamów</th>
                    <th className="pb-2 text-right">Koszt</th>
                    <th className="pb-2">Dostawca</th>
                    <th className="pb-2">Uzasadnienie</th>
                  </tr>
                </thead>
                <tbody>
                  {result.suggestions.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">
                        <Badge className={priorityColors[s.priority] || ""}>
                          {priorityLabels[s.priority] || s.priority}
                        </Badge>
                      </td>
                      <td className="py-2 font-medium">{s.partName}</td>
                      <td className="py-2 text-center">
                        {s.currentStock}/{s.minStock}
                      </td>
                      <td className="py-2 text-center font-medium">
                        {s.suggestedQuantity} szt.
                      </td>
                      <td className="py-2 text-right">
                        {s.estimatedCost.toFixed(2)} zł
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {s.preferredSupplier || "-"}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground max-w-48">
                        {s.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-bold">
                    <td colSpan={4} className="pt-3 text-right">
                      Łączny szacowany koszt:
                    </td>
                    <td className="pt-3 text-right">
                      {result.totalEstimatedCost.toFixed(2)} zł
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {!needsAction
              ? "Wszystkie części w normie — nie ma potrzeby generowania listy."
              : `Kliknij "Generuj listę zakupów" aby AI przeanalizowała${lowStockCount > 0 ? ` ${lowStockCount} części z niskim stanem` : ""}${lowStockCount > 0 && missingFromRepairsCount > 0 ? " oraz" : ""}${missingFromRepairsCount > 0 ? ` ${missingFromRepairsCount} brakujących części z aktywnych napraw` : ""}.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
