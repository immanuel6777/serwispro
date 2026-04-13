"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, Wrench } from "lucide-react";

interface SuggestedPart {
  name: string;
  category: string;
  estimatedPrice: number;
}

interface Issue {
  component: string;
  problem: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestedParts: SuggestedPart[];
}

interface Diagnosis {
  summary: string;
  issues: Issue[];
  estimatedLaborMinutes: number;
  urgency: "low" | "medium" | "high" | "critical";
}

const severityConfig: Record<
  string,
  { label: string; className: string }
> = {
  low: {
    label: "Niski",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  medium: {
    label: "Sredni",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  high: {
    label: "Wysoki",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  critical: {
    label: "Krytyczny",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

const urgencyConfig: Record<
  string,
  { label: string; className: string; icon: typeof AlertTriangle }
> = {
  low: {
    label: "Niska pilnosc",
    className: "text-green-600",
    icon: AlertTriangle,
  },
  medium: {
    label: "Srednia pilnosc",
    className: "text-yellow-600",
    icon: AlertTriangle,
  },
  high: {
    label: "Wysoka pilnosc",
    className: "text-orange-600",
    icon: AlertTriangle,
  },
  critical: {
    label: "Pilne!",
    className: "text-red-600",
    icon: AlertTriangle,
  },
};

export function DiagnosisPanel({ diagnosis }: { diagnosis: Diagnosis }) {
  const urgency = urgencyConfig[diagnosis.urgency] ?? urgencyConfig.medium;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Diagnoza AI
          </CardTitle>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${urgency.className}`}>
            <urgency.icon className="h-4 w-4" />
            {urgency.label}
          </div>
        </div>
        <CardDescription>{diagnosis.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Szacowany czas pracy:{" "}
            <strong className="text-foreground">
              {diagnosis.estimatedLaborMinutes} min
            </strong>
          </span>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">
            Wykryte problemy ({diagnosis.issues.length})
          </h4>
          {diagnosis.issues.map((issue, index) => {
            const severity =
              severityConfig[issue.severity] ?? severityConfig.medium;
            return (
              <div
                key={index}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{issue.component}</p>
                    <p className="text-sm text-muted-foreground">
                      {issue.problem}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`border-transparent shrink-0 ${severity.className}`}
                  >
                    {severity.label}
                  </Badge>
                </div>

                {issue.suggestedParts.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Sugerowane czesci
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {issue.suggestedParts.map((part, pIndex) => (
                        <div
                          key={pIndex}
                          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs"
                        >
                          <span>{part.name}</span>
                          <span className="text-muted-foreground">
                            ~{part.estimatedPrice.toFixed(2)} zl
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
