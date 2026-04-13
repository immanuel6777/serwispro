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
import { Trash2 } from "lucide-react";

interface DeleteCustomerButtonProps {
  customerId: string;
}

export function DeleteCustomerButton({
  customerId,
}: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/klienci/${customerId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Nie udalo sie usunac klienta");
      }

      router.push("/klienci");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4 mr-1" />
          Usun
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usunac klienta?</DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Usuniete zostana rowniez wszystkie
            rowery i naprawy przypisane do tego klienta.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Anuluj</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Usuwanie..." : "Usun klienta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
