import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useObservation, useUpdateObservation } from "@/features/observations/hooks/useObservations";
import type { ObservationSource } from "@/features/observations/types";
import { usePlayer, useUpdatePlayer, useUpdatePlayerStatus } from "@/features/players/hooks/usePlayers";
import type { PipelineStatus } from "@/features/players/types";
import { ClubSelect } from "@/features/players/components/ClubSelect";
import { PositionPickerDialog } from "@/features/players/components/PositionPickerDialog";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { POSITION_OPTIONS, mapLegacyPosition } from "@/features/players/positions";
import { PageHeader } from "@/components/common/PageHeader";
import { ALL_PIPELINE_STATUSES } from "@/features/pipeline/types";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

const schema = z.object({
  full_name: z
    .string()
    .min(3, "Podaj imie i nazwisko")
    .refine((value) => value.trim().split(/\s+/).length >= 2, "Podaj imie i nazwisko"),
  age: z.coerce.number().int().min(8).max(50),
  club_name: z.string().optional(),
  competition: z.string().optional(),
  match_date: z.string().min(1, "Wybierz date meczu"),
  primary_position: z.string().min(1, "Wybierz pozycje"),
  overall_rating: z.coerce.number().min(1).max(10).multipleOf(0.5),
  pipeline_status: z.string().optional(),
  source: z.string().min(1, "Wybierz zrodlo"),
  rank: z.string().min(1, "Wybierz range"),
  potential_now: z.coerce.number().int().min(1).max(5),
  potential_future: z.coerce.number().int().min(1).max(5),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  notes: z.string().optional(),
  photo_url: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditObservationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const observationId = id ?? "";
  const { data: observation, isLoading } = useObservation(observationId);
  const { data: playerData } = usePlayer(observation?.player_id ?? "");
  const { mutateAsync: updateObservation, isPending } = useUpdateObservation();
  const { mutateAsync: updatePlayer } = useUpdatePlayer();
  const { mutateAsync: updateStatus } = useUpdatePlayerStatus();
  const { user } = useAuthStore();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const auditName =
    (user?.user_metadata as { full_name?: string })?.full_name ??
    user?.email ??
    "Uzytkownik";
  const auditRole =
    (user?.user_metadata as { role?: string })?.role ?? "user";
  const fromLocation =
    typeof location.state === "object" && location.state !== null && "from" in location.state
      ? (location.state as { from?: string }).from
      : undefined;
  const goBack = () => {
    if (fromLocation) {
      navigate(fromLocation);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/observations");
    }
  };

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      full_name: "",
      age: 16,
      club_name: "",
      competition: "",
      match_date: "",
      primary_position: "",
      overall_rating: 5,
      pipeline_status: "unassigned",
      source: "",
      rank: "",
      potential_now: 3,
      potential_future: 3,
      strengths: "",
      weaknesses: "",
      notes: "",
      photo_url: "",
    },
  });

  useEffect(() => {
    if (!observation) return;
    form.reset({
      full_name: `${observation.player?.first_name ?? ""} ${observation.player?.last_name ?? ""}`.trim(),
      age: observation.player?.birth_year ? currentYear - observation.player.birth_year : 16,
      club_name: observation.player?.club?.name ?? "",
      competition: observation.competition ?? "",
      match_date: observation.observation_date ?? "",
      primary_position: mapLegacyPosition(observation.player?.primary_position ?? ""),
      overall_rating: observation.overall_rating ?? 5,
      pipeline_status: observation.player?.pipeline_status ?? "unassigned",
      source: observation.source ?? "scouting",
      rank: observation.rank ?? "",
      potential_now: observation.potential_now ?? 3,
      potential_future: observation.potential_future ?? 3,
      strengths: observation.strengths ?? "",
      weaknesses: observation.weaknesses ?? "",
      notes: observation.notes ?? "",
      photo_url: observation.photo_url ?? "",
    });
  }, [observation, form, currentYear]);

  useEffect(() => {
    if (!playerData) return;
    const { dirtyFields } = form.formState;
    if (!dirtyFields.club_name) {
      form.setValue("club_name", playerData.club?.name ?? "");
    }
    if (!dirtyFields.primary_position) {
      form.setValue("primary_position", mapLegacyPosition(playerData.primary_position ?? ""));
    }
  }, [playerData, form]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!observation) {
    return <p className="text-sm text-slate-500">Nie znaleziono obserwacji.</p>;
  }

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

  const parseFullName = (value: string) => {
    const parts = value.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: parts[0] };
    }
    const lastName = parts.pop() ?? "";
    return { firstName: parts.join(" "), lastName };
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (import.meta.env.DEV) {
        console.log("EditObservation submit", values);
      }
      const nowIso = new Date().toISOString();
      const { firstName, lastName } = parseFullName(values.full_name);
      const birthYear = currentYear - values.age;
      const clubId = await resolveClubId(values.club_name?.trim());

      await updatePlayer({
        id: observation.player_id,
        input: {
          first_name: firstName,
          last_name: lastName,
          birth_year: birthYear,
          club_id: clubId,
          primary_position: values.primary_position,
        },
      });
      if (
        values.pipeline_status &&
        values.pipeline_status !== (observation.player?.pipeline_status ?? "unassigned")
      ) {
        await updateStatus({
          id: observation.player_id,
          status: values.pipeline_status as PipelineStatus,
          fromStatus: observation.player?.pipeline_status ?? null,
        });
      }

      await updateObservation({
        id: observation.id,
        input: {
          observation_date: values.match_date,
          source: (values.source || observation.source || "scouting") as ObservationSource,
          rank: values.rank || null,
          potential_now: values.potential_now ?? null,
          potential_future: values.potential_future ?? null,
          notes: values.notes || null,
          competition: values.competition?.trim() || null,
          overall_rating: values.overall_rating ?? null,
          strengths: values.strengths?.trim() || null,
          weaknesses: values.weaknesses?.trim() || null,
          photo_url: values.photo_url?.trim() || null,
          updated_by: user?.id ?? null,
          updated_by_name: auditName,
          updated_by_role: auditRole,
          updated_at: nowIso,
        },
      });
      if (import.meta.env.DEV) {
        console.log("EditObservation update complete", {
          observationId: observation.id,
          playerId: observation.player_id,
        });
      }
      toast({
        title: "Zapisano zmiany",
        description: "Obserwacja zostala zaktualizowana.",
      });
      goBack();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nie udalo sie zapisac obserwacji";
      toast({
        variant: "destructive",
        title: "Nie udalo sie zapisac",
        description: message,
      });
      console.error("Update observation failed:", error);
    }
  };

  const handleInvalid = (errors: FieldErrors<FormValues>) => {
    const firstField = Object.keys(errors)[0] as keyof FormValues | undefined;
    if (firstField) {
      form.setFocus(firstField);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <PageHeader
        title="Edytuj obserwacje"
        subtitle={`${observation.player?.last_name ?? ""} ${observation.player?.first_name ?? ""}`.trim()}
        actions={
          <Button variant="outline" type="button" onClick={() => navigate(`/observations/${observation.id}`)}>
            Wroc do szczegolow
          </Button>
        }
      />

      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalid)} className="space-y-6">
              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-700">1. Dane zawodnika</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Imie i nazwisko <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Jan Kowalski" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Wiek <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" inputMode="numeric" min={8} max={50} {...field} />
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
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pipeline_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status zawodnika</FormLabel>
                        <Select value={field.value ?? "observed"} onValueChange={field.onChange}>
                          <FormControl>
                        <SelectTrigger ref={field.ref}>
                              <SelectValue placeholder="Wybierz status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ALL_PIPELINE_STATUSES.map((column) => (
                              <SelectItem key={column.id} value={column.id}>
                                {column.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="competition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rozgrywki</FormLabel>
                        <FormControl>
                          <Input placeholder="Liga Juniorow U17" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="match_date"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Data meczu <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-700">2. Pozycja</h2>
              <FormField
                control={form.control}
                name="primary_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Pozycja na boisku <span className="text-red-600">*</span>
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger ref={field.ref} className="flex-1">
                            <SelectValue placeholder="Wybierz pozycje" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POSITION_OPTIONS.map((option) => (
                            <SelectItem key={option.code} value={option.code}>
                              {option.label} ({option.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <PositionPickerDialog value={field.value} onSelect={field.onChange} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </section>

              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-700">3. Ocena i notatki</h2>
                <FormField
                  control={form.control}
                  name="overall_rating"
                  render={({ field }) => (
                <FormItem>
                  {(() => {
                    const ratingValue = Number.isFinite(field.value) ? field.value : 1;
                    const ratingPercent = ((ratingValue - 1) / 9) * 100;
                    const ratingLabel = Number.isInteger(ratingValue)
                      ? ratingValue.toString()
                      : ratingValue.toFixed(1);

                    return (
                      <>
                        <FormLabel>
                          Ogolna ocena: {ratingLabel}/10 <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            step={0.5}
                            value={ratingValue}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            className="overall-rating-slider h-4 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-red-600 aria-invalid:outline aria-invalid:outline-2 aria-invalid:outline-destructive"
                            style={{
                              background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${ratingPercent}%, #e2e8f0 ${ratingPercent}%, #e2e8f0 100%)`,
                            }}
                          />
                        </FormControl>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Slaby (1)</span>
                          <span>Przecietny (5)</span>
                          <span>Doskonały (10)</span>
                        </div>
                        <FormMessage />
                      </>
                    );
                  })()}
                </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="strengths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mocne strony</FormLabel>
                      <FormControl>
                        <Textarea placeholder="np. Szybkosc, technika, pozycjonowanie..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weaknesses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slabe strony</FormLabel>
                      <FormControl>
                        <Textarea placeholder="np. Gra glowa, sila fizyczna, koncentracja..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dodatkowe notatki</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Szczegolowa analiza wystepu, rekomendacje, itp." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="rank"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>
                        Ranga <span className="text-red-600">*</span>
                      </FormLabel>
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
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
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Zrodlo <span className="text-red-600">*</span>
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
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
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="potential_now"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>
                        Potencjal teraz (1-5) <span className="text-red-600">*</span>
                      </FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={5} {...field} />
                        </FormControl>
                      <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="potential_future"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>
                        Potencjal przyszly (1-5) <span className="text-red-600">*</span>
                      </FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={5} {...field} />
                        </FormControl>
                      <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-700">4. Zdjecie (opcjonalnie)</h2>
                <FormField
                  control={form.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL zdjecia</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/photo.jpg" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </section>

              <Button type="submit" disabled={isPending}>
                {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
