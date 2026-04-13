"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Search,
  User,
  Bike,
  FileText,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bikes?: BikeType[];
}

interface BikeType {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  type: string;
}

const BIKE_TYPES = [
  { value: "MTB", label: "MTB" },
  { value: "szosa", label: "Szosa" },
  { value: "gravel", label: "Gravel" },
  { value: "miejski", label: "Miejski" },
  { value: "elektryczny", label: "Elektryczny" },
  { value: "inny", label: "Inny" },
];

const STEPS = [
  { number: 1, label: "Klient", icon: User },
  { number: 2, label: "Rower", icon: Bike },
  { number: 3, label: "Problem", icon: FileText },
];

export default function NowaNaprawaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 - Customer selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Step 2 - Bike selection
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [selectedBike, setSelectedBike] = useState<BikeType | null>(null);
  const [showNewBikeForm, setShowNewBikeForm] = useState(false);
  const [newBike, setNewBike] = useState({
    brand: "",
    model: "",
    year: "",
    type: "MTB",
  });
  const [loadingBikes, setLoadingBikes] = useState(false);

  // Step 3 - Problem description
  const [problemDesc, setProblemDesc] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Fetch customers on mount
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/klienci");
        if (!res.ok) throw new Error("Nie udało się pobrać klientów");
        const data = await res.json();
        setCustomers(data);
      } catch {
        setError("Nie udało się pobrać listy klientów");
      } finally {
        setLoadingCustomers(false);
      }
    }
    fetchCustomers();
  }, []);

  // Fetch bikes when customer is selected
  useEffect(() => {
    if (!selectedCustomer) {
      setBikes([]);
      return;
    }

    async function fetchBikes() {
      setLoadingBikes(true);
      try {
        const res = await fetch(`/api/klienci/${selectedCustomer!.id}`);
        if (!res.ok) throw new Error("Nie udało się pobrać rowerów");
        const data = await res.json();
        setBikes(data.bikes || []);
      } catch {
        setError("Nie udało się pobrać rowerów klienta");
      } finally {
        setLoadingBikes(false);
      }
    }
    fetchBikes();
  }, [selectedCustomer]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  async function handleAddBike() {
    if (!selectedCustomer || !newBike.brand || !newBike.model) return;
    setError("");

    try {
      const res = await fetch(`/api/klienci/${selectedCustomer.id}/bikes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBike),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Nie udało się dodać roweru");
      }

      const bike = await res.json();
      setBikes((prev) => [...prev, bike]);
      setSelectedBike(bike);
      setShowNewBikeForm(false);
      setNewBike({ brand: "", model: "", year: "", type: "MTB" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    }
  }

  async function handleSubmit() {
    if (!selectedBike || !problemDesc.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Create repair
      const repairRes = await fetch("/api/naprawy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bikeId: selectedBike.id,
          problemDesc: problemDesc.trim(),
        }),
      });

      if (!repairRes.ok) {
        const err = await repairRes.json();
        throw new Error(err.error || "Nie udało się utworzyć naprawy");
      }

      const repair = await repairRes.json();

      // 2. Run AI analysis
      setAiAnalyzing(true);
      try {
        await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bikeId: selectedBike.id,
            problemDesc: problemDesc.trim(),
            repairId: repair.id,
          }),
        });
      } catch {
        // AI analysis failure is non-critical, redirect anyway
      }

      // 3. Redirect to repair detail
      router.push(`/naprawy/${repair.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      setSubmitting(false);
      setAiAnalyzing(false);
    }
  }

  // Loading overlay for AI analysis
  if (aiAnalyzing) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="size-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">AI analizuje...</p>
              <p className="text-sm text-muted-foreground">
                Trwa diagnoza problemu i przygotowanie wyceny. To może potrwać kilka sekund.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/naprawy")}
          className="mb-2"
        >
          <ArrowLeft className="size-4" />
          Powrót do listy
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nowa naprawa</h1>
        <p className="text-sm text-muted-foreground">
          Utwórz nowe zlecenie naprawy w 3 krokach
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.number;
          const isCompleted = step > s.number;

          return (
            <div key={s.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary/10 text-primary",
                    !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <Separator
                  className={cn(
                    "mx-2 flex-1",
                    step > s.number ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Select customer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Wybierz klienta</CardTitle>
            <CardDescription>
              Wyszukaj klienta po imieniu, e-mailu lub telefonie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj klienta..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingCustomers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {customerSearch
                  ? "Nie znaleziono klientów pasujących do wyszukiwania"
                  : "Brak klientów w bazie"}
              </div>
            ) : (
              <div className="max-h-[320px] space-y-1 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setSelectedBike(null);
                      setError("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selectedCustomer?.id === customer.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted"
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[customer.email, customer.phone]
                          .filter(Boolean)
                          .join(" · ") || "Brak danych kontaktowych"}
                      </p>
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <Check className="size-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                disabled={!selectedCustomer}
                onClick={() => setStep(2)}
              >
                Dalej
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select or add bike */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Wybierz rower</CardTitle>
            <CardDescription>
              Wybierz rower klienta {selectedCustomer?.name} lub dodaj nowy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingBikes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {bikes.length > 0 && (
                  <div className="space-y-1">
                    {bikes.map((bike) => (
                      <button
                        key={bike.id}
                        type="button"
                        onClick={() => {
                          setSelectedBike(bike);
                          setShowNewBikeForm(false);
                          setError("");
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          selectedBike?.id === bike.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted"
                        )}
                      >
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                          <Bike className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-sm font-medium">
                            {bike.brand} {bike.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {bike.type}
                            {bike.year ? ` · ${bike.year}` : ""}
                          </p>
                        </div>
                        {selectedBike?.id === bike.id && (
                          <Check className="size-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {!showNewBikeForm ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowNewBikeForm(true);
                      setSelectedBike(null);
                    }}
                  >
                    <Plus className="size-4" />
                    Dodaj nowy rower
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="text-sm font-medium">Nowy rower</p>
                    <div className="grid gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="bike-brand">Marka *</Label>
                        <Input
                          id="bike-brand"
                          placeholder="np. Trek, Giant, Specialized"
                          value={newBike.brand}
                          onChange={(e) =>
                            setNewBike((prev) => ({ ...prev, brand: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="bike-model">Model *</Label>
                        <Input
                          id="bike-model"
                          placeholder="np. Marlin 7, Defy"
                          value={newBike.model}
                          onChange={(e) =>
                            setNewBike((prev) => ({ ...prev, model: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="bike-year">Rocznik</Label>
                          <Input
                            id="bike-year"
                            type="number"
                            min={1990}
                            max={2030}
                            placeholder="2024"
                            value={newBike.year}
                            onChange={(e) =>
                              setNewBike((prev) => ({ ...prev, year: e.target.value }))
                            }
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Typ *</Label>
                          <Select
                            value={newBike.type}
                            onValueChange={(v) =>
                              setNewBike((prev) => ({ ...prev, type: v ?? "MTB" }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Wybierz typ" />
                            </SelectTrigger>
                            <SelectContent>
                              {BIKE_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowNewBikeForm(false);
                          setNewBike({ brand: "", model: "", year: "", type: "MTB" });
                        }}
                      >
                        Anuluj
                      </Button>
                      <Button
                        size="sm"
                        disabled={!newBike.brand || !newBike.model}
                        onClick={handleAddBike}
                      >
                        Dodaj rower
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" />
                Wstecz
              </Button>
              <Button
                disabled={!selectedBike}
                onClick={() => setStep(3)}
              >
                Dalej
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Describe problem */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Opis problemu</CardTitle>
            <CardDescription>
              Opisz problem z rowerem {selectedBike?.brand} {selectedBike?.model} klienta{" "}
              {selectedCustomer?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="problem">Opis problemu *</Label>
              <Textarea
                id="problem"
                placeholder="Opisz szczegółowo problem zgłoszony przez klienta, np. dziwne dźwięki podczas pedałowania, problemy z hamulcami, przeskakujący łańcuch..."
                value={problemDesc}
                onChange={(e) => setProblemDesc(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Im dokładniejszy opis, tym lepsza diagnoza AI.
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-1 font-medium">Podsumowanie zlecenia:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>Klient: {selectedCustomer?.name}</li>
                <li>
                  Rower: {selectedBike?.brand} {selectedBike?.model}
                  {selectedBike?.year ? ` (${selectedBike.year})` : ""}
                </li>
              </ul>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4" />
                Wstecz
              </Button>
              <Button
                disabled={!problemDesc.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Tworzenie...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Utwórz naprawę
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
