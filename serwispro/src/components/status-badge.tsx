import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RepairStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  RepairStatus,
  { label: string; className: string }
> = {
  ACCEPTED: {
    label: "Przyjęta",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  DIAGNOSED: {
    label: "Zdiagnozowana",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  WAITING_APPROVAL: {
    label: "Oczekuje na akceptację",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  WAITING_PARTS: {
    label: "Oczekuje na części",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  IN_PROGRESS: {
    label: "W naprawie",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  READY: {
    label: "Gotowa do odbioru",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  COMPLETED: {
    label: "Zakończona",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

interface StatusBadgeProps {
  status: RepairStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function getStatusLabel(status: RepairStatus): string {
  return STATUS_CONFIG[status].label;
}
