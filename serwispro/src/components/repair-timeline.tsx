"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type RepairStatus =
  | "ACCEPTED"
  | "DIAGNOSED"
  | "WAITING_APPROVAL"
  | "WAITING_PARTS"
  | "IN_PROGRESS"
  | "READY"
  | "COMPLETED";

const STATUS_ORDER: RepairStatus[] = [
  "ACCEPTED",
  "DIAGNOSED",
  "WAITING_APPROVAL",
  "WAITING_PARTS",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
];

const STATUS_LABELS: Record<RepairStatus, string> = {
  ACCEPTED: "Przyjeta",
  DIAGNOSED: "Zdiagnozowana",
  WAITING_APPROVAL: "Oczekuje na akceptacje",
  WAITING_PARTS: "Oczekuje na czesci",
  IN_PROGRESS: "W trakcie naprawy",
  READY: "Gotowa do odbioru",
  COMPLETED: "Zakonczona",
};

interface Transition {
  targetStatus: RepairStatus;
  label: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
}

function getTransitions(currentStatus: RepairStatus): Transition[] {
  switch (currentStatus) {
    case "ACCEPTED":
      return [];
    case "DIAGNOSED":
      return [];
    case "WAITING_APPROVAL":
      return [
        { targetStatus: "WAITING_PARTS", label: "Zamow czesci", variant: "outline" },
        { targetStatus: "IN_PROGRESS", label: "Rozpocznij naprawe" },
      ];
    case "WAITING_PARTS":
      return [
        { targetStatus: "IN_PROGRESS", label: "Rozpocznij naprawe" },
      ];
    case "IN_PROGRESS":
      return [
        { targetStatus: "READY", label: "Oznacz jako gotowy" },
      ];
    case "READY":
      return [
        { targetStatus: "COMPLETED", label: "Zakoncz i wydaj" },
      ];
    case "COMPLETED":
      return [];
    default:
      return [];
  }
}

interface RepairTimelineProps {
  repairId: string;
  currentStatus: RepairStatus;
  createdAt: string;
  updatedAt: string;
}

export function RepairTimeline({
  repairId,
  currentStatus,
  createdAt,
  updatedAt,
}: RepairTimelineProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const transitions = getTransitions(currentStatus);

  async function handleTransition(targetStatus: RepairStatus) {
    setLoading(targetStatus);
    try {
      const res = await fetch(`/api/naprawy/${repairId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad zmiany statusu");
      }

      toast.success(`Status zmieniony na: ${STATUS_LABELS[targetStatus]}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nie udalo sie zmienic statusu"
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status naprawy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0">
          {STATUS_ORDER.map((status, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div key={status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {isPast ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isCurrent ? (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  )}
                  {index < STATUS_ORDER.length - 1 && (
                    <div
                      className={`w-px flex-1 min-h-6 ${
                        isPast
                          ? "bg-green-500"
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-4 ${isFuture ? "opacity-40" : ""}`}>
                  <p
                    className={`text-sm leading-5 ${
                      isCurrent ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Od{" "}
                      {new Date(updatedAt).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {index === 0 && isPast && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(createdAt).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {transitions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Akcje
              </p>
              {transitions.map((transition) => (
                <Button
                  key={transition.targetStatus}
                  variant={transition.variant ?? "default"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => handleTransition(transition.targetStatus)}
                  disabled={loading !== null}
                >
                  {transition.label}
                  {loading === transition.targetStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
