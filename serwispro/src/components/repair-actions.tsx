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
  Bot,
  CheckCircle,
  Loader2,
  Sparkles,
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

interface RepairActionsProps {
  repairId: string;
  bikeId: string;
  problemDesc: string;
  currentStatus: RepairStatus;
  hasAiDiagnosis: boolean;
  hasAiEstimate: boolean;
  hasAiEmail: boolean;
  customerEmail: string | null;
}

export function RepairActions({
  repairId,
  bikeId,
  problemDesc,
  currentStatus,
  hasAiDiagnosis,
  hasAiEstimate,
  hasAiEmail,
  customerEmail,
}: RepairActionsProps) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [approving, setApproving] = useState(false);

  const hasAllAiResults = hasAiDiagnosis && hasAiEstimate && hasAiEmail;
  const canApprove =
    hasAllAiResults &&
    (currentStatus === "ACCEPTED" || currentStatus === "DIAGNOSED");

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bikeId, problemDesc, repairId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad analizy AI");
      }

      toast.success("Analiza AI zakonczona pomyslnie");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nie udalo sie uruchomic analizy AI"
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleApproveAll() {
    setApproving(true);
    try {
      // Update status to WAITING_APPROVAL
      const res = await fetch(`/api/naprawy/${repairId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WAITING_APPROVAL" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad zatwierdzania");
      }

      // Send email to customer if email exists
      if (customerEmail) {
        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: customerEmail,
              subject: "Wycena naprawy roweru - SerwisPro",
              body: "Wycena zostala przygotowana. Sprawdz szczegoly w zalaczonej wiadomosci.",
              repairId,
              type: "wycena",
            }),
          });
          toast.success("Wycena zatwierdzona i email wyslany do klienta");
        } catch {
          toast.success("Wycena zatwierdzona, ale nie udalo sie wyslac emaila");
        }
      } else {
        toast.success("Wycena zatwierdzona (brak adresu email klienta)");
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nie udalo sie zatwierdzic wyceny"
      );
    } finally {
      setApproving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Akcje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full"
          variant={hasAllAiResults ? "outline" : "default"}
          onClick={handleAnalyze}
          disabled={analyzing || approving}
        >
          {analyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          {analyzing
            ? "Analizowanie..."
            : hasAllAiResults
              ? "Uruchom analize ponownie"
              : "Uruchom analize AI"}
        </Button>

        {canApprove && (
          <>
            <Separator />
            <Button
              className="w-full"
              onClick={handleApproveAll}
              disabled={analyzing || approving}
            >
              {approving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {approving ? "Zatwierdzanie..." : "Zatwierdz wszystko"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Zmieni status na &quot;Oczekuje na akceptacje&quot;
              {customerEmail ? " i wysle wycene do klienta" : ""}
            </p>
          </>
        )}

        {!hasAllAiResults && currentStatus === "ACCEPTED" && (
          <p className="text-xs text-muted-foreground text-center">
            Uruchom analize AI, aby uzyskac diagnoze, wycene i propozycje
            wiadomosci do klienta.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
