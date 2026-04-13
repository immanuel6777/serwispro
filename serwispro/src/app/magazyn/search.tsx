"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface MagazynSearchProps {
  defaultValue: string;
  category: string;
}

export function MagazynSearch({ defaultValue, category }: MagazynSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(qs ? `/magazyn?${qs}` : "/magazyn");
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Szukaj po nazwie, marce lub SKU..."
          className="pl-9"
        />
      </div>
    </form>
  );
}
