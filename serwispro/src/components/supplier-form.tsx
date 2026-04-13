"use client";

import { useState } from "react";
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

interface SupplierFormProps {
  supplier?: { id: string; name: string; url?: string | null; email?: string | null };
  trigger?: React.ReactNode;
}

export function SupplierForm({ supplier, trigger }: SupplierFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!supplier;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      url: formData.get("url") as string,
      email: formData.get("email") as string,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/dostawcy/${supplier.id}` : "/api/dostawcy",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Dostawca zaktualizowany" : "Dostawca dodany");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Błąd zapisu dostawcy");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{isEdit ? "Edytuj" : "Dodaj dostawcę"}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edytuj dostawcę" : "Nowy dostawca"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nazwa *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={supplier?.name || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="url">Strona WWW</Label>
            <Input
              id="url"
              name="url"
              type="url"
              defaultValue={supplier?.url || ""}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={supplier?.email || ""}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Zapisywanie..." : isEdit ? "Zapisz zmiany" : "Dodaj dostawcę"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
