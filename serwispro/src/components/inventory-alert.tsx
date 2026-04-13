"use client";

import { AlertTriangle } from "lucide-react";

interface LowStockItem {
  name: string;
  quantity: number;
  minStock: number;
}

interface InventoryAlertProps {
  items: LowStockItem[];
}

export function InventoryAlert({ items }: InventoryAlertProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-amber-800 dark:text-amber-200">
            Niski stan magazynowy
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {items.length === 1
              ? "1 część wymaga uzupełnienia:"
              : `${items.length} części wymaga uzupełnienia:`}
          </p>
          <ul className="mt-2 space-y-1">
            {items.map((item) => (
              <li
                key={item.name}
                className="text-sm text-amber-700 dark:text-amber-300"
              >
                <span className="font-medium">{item.name}</span>
                {" — "}
                <span>
                  {item.quantity} / {item.minStock} szt.
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
