"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const BIKE_TYPES = [
  { value: "MTB", label: "MTB" },
  { value: "szosa", label: "Szosa" },
  { value: "gravel", label: "Gravel" },
  { value: "miejski", label: "Miejski" },
  { value: "elektryczny", label: "Elektryczny" },
  { value: "inny", label: "Inny" },
];

interface BikeFormProps {
  customerId: string;
}

export function BikeForm({ customerId }: BikeFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bikeType, setBikeType] = useState<string>("MTB");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      year: formData.get("year") as string,
      type: bikeType,
    };

    try {
      const res = await fetch(`/api/klienci/${customerId}/bikes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Wystapil blad");
      }

      setOpen(false);
      setBikeType("MTB");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystapil blad");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-1" />
          Dodaj rower
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy rower</DialogTitle>
          <DialogDescription>
            Dodaj rower do profilu klienta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="brand">Marka *</Label>
            <Input
              id="brand"
              name="brand"
              required
              placeholder="np. Trek, Giant, Specialized"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              name="model"
              required
              placeholder="np. Marlin 7, Defy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year">Rocznik</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min={1990}
                max={2030}
                placeholder="2024"
              />
            </div>

            <div className="grid gap-2">
              <Label>Typ *</Label>
              <Select value={bikeType} onValueChange={(v) => setBikeType(v ?? "MTB")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz typ" />
                </SelectTrigger>
                <SelectContent>
                  {BIKE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Anuluj</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Dodawanie..." : "Dodaj rower"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
