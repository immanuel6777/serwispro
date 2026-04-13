"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Part {
  id: string;
  name: string;
  category: string;
}

interface SupplierPartFormProps {
  supplierId: string;
  trigger?: React.ReactNode;
}

export function SupplierPartForm({ supplierId, trigger }: SupplierPartFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/magazyn")
        .then((r) => r.json())
        .then((data) => setParts(data))
        .catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/dostawcy/${supplierId}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: selectedPartId,
          price: parseFloat(formData.get("price") as string),
          url: formData.get("url") as string || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Błąd");
      }
      toast.success("Część przypisana do dostawcy");
      setOpen(false);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Błąd zapisu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">Dodaj część</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Przypisz część do dostawcy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="partId">Część *</Label>
            <select
              id="partId"
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Wybierz część...</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="price">Cena (PLN) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <Label htmlFor="url">Link do produktu</Label>
            <Input id="url" name="url" type="url" placeholder="https://..." />
          </div>
          <Button type="submit" disabled={loading || !selectedPartId} className="w-full">
            {loading ? "Zapisywanie..." : "Przypisz część"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
