"use client";

import { DiagnosisPanel } from "@/components/diagnosis-panel";
import { EstimateTable } from "@/components/estimate-table";
import { EmailPreview } from "@/components/email-preview";
import { RepairTimeline } from "@/components/repair-timeline";
import { RepairActions } from "@/components/repair-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, FileText, Mail, Calculator } from "lucide-react";

interface SerializedRepair {
  id: string;
  status: string;
  problemDesc: string;
  aiDiagnosis: unknown;
  aiEstimate: unknown;
  aiEmail: unknown;
  laborCost: number | null;
  totalCost: number | null;
  notes: string | null;
  bikeId: string;
  createdAt: string;
  updatedAt: string;
  bike: {
    id: string;
    brand: string;
    model: string;
    year: number | null;
    type: string;
    customer: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    };
  };
  parts: Array<{
    id: string;
    quantity: number;
    price: number;
    part: {
      id: string;
      name: string;
      category: string;
      brand: string | null;
      defaultPrice: number;
    };
  }>;
  emails: Array<{
    id: string;
    to: string;
    subject: string;
    body: string;
    type: string;
    sentAt: string;
  }>;
}

type RepairStatus =
  | "ACCEPTED"
  | "DIAGNOSED"
  | "WAITING_APPROVAL"
  | "WAITING_PARTS"
  | "IN_PROGRESS"
  | "READY"
  | "COMPLETED";

export function RepairDetailClient({
  repair,
}: {
  repair: SerializedRepair;
}) {
  const hasDiagnosis = repair.aiDiagnosis !== null;
  const hasEstimate = repair.aiEstimate !== null;
  const hasEmail = repair.aiEmail !== null;
  const hasAnyAi = hasDiagnosis || hasEstimate || hasEmail;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left column - AI results (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {hasAnyAi ? (
          <Tabs defaultValue={hasDiagnosis ? "diagnosis" : hasEstimate ? "estimate" : "email"}>
            <TabsList>
              {hasDiagnosis && (
                <TabsTrigger value="diagnosis">
                  <FileText className="mr-1.5 h-4 w-4" />
                  Diagnoza
                </TabsTrigger>
              )}
              {hasEstimate && (
                <TabsTrigger value="estimate">
                  <Calculator className="mr-1.5 h-4 w-4" />
                  Wycena
                </TabsTrigger>
              )}
              {hasEmail && (
                <TabsTrigger value="email">
                  <Mail className="mr-1.5 h-4 w-4" />
                  Email
                </TabsTrigger>
              )}
            </TabsList>

            {hasDiagnosis && (
              <TabsContent value="diagnosis">
                <DiagnosisPanel
                  diagnosis={repair.aiDiagnosis as Parameters<typeof DiagnosisPanel>[0]["diagnosis"]}
                />
              </TabsContent>
            )}

            {hasEstimate && (
              <TabsContent value="estimate">
                <EstimateTable
                  estimate={repair.aiEstimate as Parameters<typeof EstimateTable>[0]["estimate"]}
                  repairId={repair.id}
                />
              </TabsContent>
            )}

            {hasEmail && (
              <TabsContent value="email">
                <EmailPreview
                  email={repair.aiEmail as Parameters<typeof EmailPreview>[0]["email"]}
                  repairId={repair.id}
                  customerEmail={repair.bike.customer.email}
                />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>Brak analizy AI</CardTitle>
              <CardDescription>
                Uruchom analize AI, aby uzyskac automatyczna diagnoze problemu,
                wycene naprawy oraz propozycje wiadomosci do klienta.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Sent emails history */}
        {repair.emails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historia wiadomosci</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repair.emails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-start justify-between rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{email.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Do: {email.to} | Typ: {email.type}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(email.sentAt).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right column - Timeline + Actions (1/3) */}
      <div className="space-y-6">
        <RepairActions
          repairId={repair.id}
          bikeId={repair.bikeId}
          problemDesc={repair.problemDesc}
          currentStatus={repair.status as RepairStatus}
          hasAiDiagnosis={hasDiagnosis}
          hasAiEstimate={hasEstimate}
          hasAiEmail={hasEmail}
          customerEmail={repair.bike.customer.email}
        />

        <RepairTimeline
          repairId={repair.id}
          currentStatus={repair.status as RepairStatus}
          createdAt={repair.createdAt}
          updatedAt={repair.updatedAt}
        />

        {/* Parts list if any */}
        {repair.parts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Przypisane czesci ({repair.parts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {repair.parts.map((rp) => (
                  <div
                    key={rp.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium">{rp.part.name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        x{rp.quantity}
                      </span>
                    </div>
                    <span className="font-medium">
                      {(rp.price * rp.quantity).toFixed(2)} zl
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
