import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useCreateObservation } from "../hooks/useObservations";
import { useCreatePlayer } from "@/features/players/hooks/usePlayers";
import { ClubSelect } from "@/features/players/components/ClubSelect";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSync } from "@/features/offline/hooks/useSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const wizardSchema = z.object({
  first_name: z.string().min(2, "Podaj imie"),
  last_name: z.string().min(2, "Podaj nazwisko"),
  birth_year: z.coerce.number().int().min(2000).max(2030),
  club_name: z.string().optional(),
  primary_position: z.string().min(1, "Wybierz pozycje"),
  dominant_foot: z.string().min(1, "Wybierz noge"),
  rank: z.string().min(1, "Wybierz range"),
  potential_now: z.coerce.number().int().min(1).max(5),
  potential_future: z.coerce.number().int().min(1).max(5),
  source: z.string().min(1, "Wybierz zrodlo"),
  notes: z.string().optional(),
});

type WizardFormValues = z.infer<typeof wizardSchema>;

const steps = [
  { id: 1, title: "Zawodnik" },
  { id: 2, title: "Pozycja" },
  { id: 3, title: "Ocena" },
  { id: 4, title: "Zdjecie" },
];

type PrefillPlayer = {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  club_name?: string;
  primary_position?: string;
  dominant_foot?: string;
};

type ObservationWizardProps = {
  prefillPlayer?: PrefillPlayer;
  lockPlayerFields?: boolean;
};

export function ObservationWizard({ prefillPlayer, lockPlayerFields = false }: ObservationWizardProps) {
  const [step, setStep] = useState(1);
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const { addOfflineObservation } = useSync();
  const { mutateAsync: createObservation, isPending: isSaving } = useCreateObservation();
  const { mutateAsync: createPlayer } = useCreatePlayer();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      birth_year: new Date().getFullYear() - 14,
      club_name: "",
      primary_position: "",
      dominant_foot: "",
      rank: "",
      potential_now: 3,
      potential_future: 3,
      source: "scouting",
      notes: "",
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem("scoutpro-observation-draft");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WizardFormValues;
        form.reset(parsed);
      } catch {
        localStorage.removeItem("scoutpro-observation-draft");
      }
    }
  }, [form]);

  useEffect(() => {
    if (!prefillPlayer) return;
    form.setValue("first_name", prefillPlayer.first_name);
    form.setValue("last_name", prefillPlayer.last_name);
    form.setValue("birth_year", prefillPlayer.birth_year);
    form.setValue("club_name", prefillPlayer.club_name ?? "");
    form.setValue("primary_position", prefillPlayer.primary_position ?? "");
    form.setValue("dominant_foot", prefillPlayer.dominant_foot ?? "");
  }, [prefillPlayer, form]);

  const stepFields: Record<number, (keyof WizardFormValues)[]> = {
    1: lockPlayerFields ? [] : ["first_name", "last_name", "birth_year", "club_name"],
    2: lockPlayerFields ? [] : ["primary_position", "dominant_foot"],
    3: ["rank", "potential_now", "potential_future", "source", "notes"],
    4: [],
  };

  const resolveClubId = async (clubName?: string) => {
    if (!clubName) return null;
    const { data: existing } = await supabase
      .from("clubs")
      .select("id")
      .eq("name", clubName)
      .maybeSingle();

    if (existing?.id) {
      return existing.id as string;
    }
    throw new Error(
      "Brak uprawnien do dodania klubu. Wybierz istniejacy klub lub zostaw pole puste."
    );
  };

  const handleNext = async () => {
    const fields = stepFields[step];
    const valid = await form.trigger(fields);
    if (valid) {
      setStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (values: WizardFormValues) => {
    if (!user) {
      setSubmitError("Brak zalogowanego uzytkownika");
      return;
    }
    setSubmitError(null);
    try {
      if (!isOnline) {
        await addOfflineObservation({
          localId: uuidv4(),
          data: {
            player_id: prefillPlayer?.id,
            first_name: values.first_name,
            last_name: values.last_name,
            birth_year: values.birth_year,
            club_name: values.club_name?.trim(),
            primary_position: values.primary_position,
            dominant_foot: values.dominant_foot,
            source: values.source,
            rank: values.rank,
            notes: values.notes,
            potential_now: values.potential_now,
            potential_future: values.potential_future,
            observation_date: format(new Date(), "yyyy-MM-dd"),
          },
          createdAt: new Date(),
          syncStatus: "pending",
          syncAttempts: 0,
        });
      } else {
        let playerId = prefillPlayer?.id;
        if (!playerId) {
          const clubId = await resolveClubId(values.club_name?.trim());
          const player = await createPlayer({
            first_name: values.first_name,
            last_name: values.last_name,
            birth_year: values.birth_year,
            club_id: clubId,
            primary_position: values.primary_position,
            dominant_foot: values.dominant_foot,
            pipeline_status: "observed",
          });
          playerId = player.id;
        }

        await createObservation({
          player_id: playerId,
          scout_id: user.id,
          source: values.source,
          rank: values.rank,
          notes: values.notes,
          potential_now: values.potential_now,
          potential_future: values.potential_future,
          observation_date: format(new Date(), "yyyy-MM-dd"),
        });
      }

      form.reset();
      setStep(1);
      localStorage.removeItem("scoutpro-observation-draft");
    } catch {
      setSubmitError("Nie udalo sie zapisac obserwacji");
    }
  };

  const handleSaveDraft = () => {
    const values = form.getValues();
    localStorage.setItem("scoutpro-observation-draft", JSON.stringify(values));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Krok {step}/4</span>
        <span>{steps[step - 1].title}</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwisko *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kowalski" disabled={lockPlayerFields} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imie *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan" disabled={lockPlayerFields} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birth_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rocznik *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" disabled={lockPlayerFields} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="club_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klub</FormLabel>
                    <FormControl>
                      <ClubSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Wybierz klub"
                        disabled={lockPlayerFields}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="primary_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pozycja glowna *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={lockPlayerFields}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz pozycje" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">GK</SelectItem>
                        <SelectItem value="2">RB</SelectItem>
                        <SelectItem value="3">LB</SelectItem>
                        <SelectItem value="4">CB</SelectItem>
                        <SelectItem value="5">CB</SelectItem>
                        <SelectItem value="6">CDM</SelectItem>
                        <SelectItem value="8">CM</SelectItem>
                        <SelectItem value="10">CAM</SelectItem>
                        <SelectItem value="7">RW</SelectItem>
                        <SelectItem value="11">LW</SelectItem>
                        <SelectItem value="9">ST</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dominant_foot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Noga dominujaca *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={lockPlayerFields}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz noge" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="right">Prawa</SelectItem>
                        <SelectItem value="left">Lewa</SelectItem>
                        <SelectItem value="both">Obie</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ranga *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A - TOP</SelectItem>
                        <SelectItem value="B">B - Dobry</SelectItem>
                        <SelectItem value="C">C - Szeroka kadra</SelectItem>
                        <SelectItem value="D">D - Slaby</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="potential_now"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potencjal teraz (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={5} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="potential_future"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potencjal przyszly (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={5} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zrodlo *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz zrodlo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scouting">Skauting</SelectItem>
                        <SelectItem value="referral">Polecenie</SelectItem>
                        <SelectItem value="application">Zgloszenie</SelectItem>
                        <SelectItem value="trainer_report">Raport trenera</SelectItem>
                        <SelectItem value="scout_report">Raport skauta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Komentarz</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Krotki opis" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 4 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
              Dodawanie zdjec zostanie wlaczone w kolejnym kroku.
            </div>
          )}

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 1}>
              Wstecz
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft}>
              Zapisz szkic
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={handleNext}>
                Dalej
              </Button>
            ) : (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Zapisywanie..." : "Zapisz obserwacje"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
