"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

interface EmailData {
  subject: string;
  body: string;
  includesPriceTable: boolean;
}

interface EmailPreviewProps {
  email: EmailData;
  repairId: string;
  customerEmail: string | null;
  onRegenerate?: () => void;
}

export function EmailPreview({
  email,
  repairId,
  customerEmail,
  onRegenerate,
}: EmailPreviewProps) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleSend() {
    if (!customerEmail) {
      toast.error("Klient nie ma podanego adresu email");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customerEmail,
          subject,
          body,
          repairId,
          type: "wycena",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad wysylki");
      }

      toast.success("Email wyslany pomyslnie");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nie udalo sie wyslac emaila"
      );
    } finally {
      setSending(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repairId, type: "wycena" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad generowania");
      }

      const data = await res.json();
      if (data.email) {
        setSubject(data.email.subject);
        setBody(data.email.body);
      }
      toast.success("Email wygenerowany ponownie");
      onRegenerate?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nie udalo sie wygenerowac emaila"
      );
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Wiadomosc do klienta
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating || sending}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`}
              />
              Generuj ponownie
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || regenerating || !customerEmail}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {sending ? "Wysylanie..." : "Wyslij email"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!customerEmail && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            Klient nie ma podanego adresu email. Dodaj adres email w profilu klienta, aby moc wyslac wiadomosc.
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email-subject">Temat</Label>
          <Input
            id="email-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-body">Tresc</Label>
          <Textarea
            id="email-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        </div>
        {email.includesPriceTable && (
          <p className="text-xs text-muted-foreground">
            Ta wiadomosc zawiera tabele cenowa.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
