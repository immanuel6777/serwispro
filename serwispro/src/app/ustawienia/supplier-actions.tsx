"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function SupplierActions({ supplierId }: { supplierId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Czy na pewno chcesz usunąć tego dostawcę?")) return;
    try {
      const res = await fetch(`/api/dostawcy/${supplierId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Dostawca usunięty");
      router.refresh();
    } catch {
      toast.error("Błąd usuwania dostawcy");
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
