"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "hamulce", label: "Hamulce" },
  { value: "napęd", label: "Napęd" },
  { value: "koła", label: "Koła" },
  { value: "rama", label: "Rama" },
  { value: "kierownica", label: "Kierownica" },
  { value: "siodło", label: "Siodło" },
  { value: "oświetlenie", label: "Oświetlenie" },
  { value: "akcesoria", label: "Akcesoria" },
  { value: "inne", label: "Inne" },
] as const;

interface PartData {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  sku: string | null;
  defaultPrice: string | number;
  inventory: {
    quantity: number;
    minStock: number;
    location: string | null;
  } | null;
}

interface PartFormProps {
  part?: PartData;
  trigger: React.ReactNode;
}

export function PartForm({ part, trigger }: PartFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(part?.name ?? "");
  const [category, setCategory] = useState(part?.category ?? "hamulce");
  const [brand, setBrand] = useState(part?.brand ?? "");
  const [sku, setSku] = useState(part?.sku ?? "");
  const [defaultPrice, setDefaultPrice] = useState(
    part ? String(Number(part.defaultPrice)) : ""
  );
  const [quantity, setQuantity] = useState(
    part?.inventory ? String(part.inventory.quantity) : "0"
  );
  const [minStock, setMinStock] = useState(
    part?.inventory ? String(part.inventory.minStock) : "2"
  );
  const [location, setLocation] = useState(part?.inventory?.location ?? "");

  const isEditing = !!part;

  function resetForm() {
    if (!part) {
      setName("");
      setCategory("hamulce");
      setBrand("");
      setSku("");
      setDefaultPrice("");
      setQuantity("0");
      setMinStock("2");
      setLocation("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        category,
        brand: brand || undefined,
        sku: sku || undefined,
        defaultPrice: parseFloat(defaultPrice),
        quantity: parseInt(quantity, 10),
        minStock: parseInt(minStock, 10),
        location: location || undefined,
      };

      const url = isEditing ? `/api/magazyn/${part.id}` : "/api/magazyn";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Wystąpił błąd");
      }

      toast.success(
        isEditing ? "Część zaktualizowana" : "Część dodana do magazynu"
      );
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edytuj część" : "Dodaj nową część"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Zaktualizuj dane części i stanu magazynowego."
              : "Wypełnij formularz, aby dodać część do magazynu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="part-name">Nazwa *</Label>
            <Input
              id="part-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Klocki hamulcowe Shimano B01S"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Kategoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="part-brand">Marka</Label>
              <Input
                id="part-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="np. Shimano"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="part-sku">SKU</Label>
              <Input
                id="part-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="np. SHM-B01S"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="part-price">Cena domyślna (zł) *</Label>
              <Input
                id="part-price"
                type="number"
                step="0.01"
                min="0"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="part-quantity">Ilość</Label>
              <Input
                id="part-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="part-min-stock">Min. stan</Label>
              <Input
                id="part-min-stock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="part-location">Lokalizacja</Label>
              <Input
                id="part-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="np. A-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Zapisywanie..."
                : isEditing
                  ? "Zapisz zmiany"
                  : "Dodaj część"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
