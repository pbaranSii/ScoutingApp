import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useCreateObservation } from "../hooks/useObservations";
import type { ObservationSource } from "../types";
import { useCreatePlayer, useUpdatePlayer } from "@/features/players/hooks/usePlayers";
import { ClubSelect } from "@/features/players/components/ClubSelect";
import { PositionPickerDialog } from "@/features/players/components/PositionPickerDialog";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSync } from "@/features/offline/hooks/useSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { POSITION_OPTIONS, mapLegacyPosition } from "@/features/players/positions";
import { toast } from "@/hooks/use-toast";
import { MediaPreview, MediaUploadModal } from "@/features/multimedia";
import { uploadMediaFile, addYoutubeLink } from "@/features/multimedia/api/multimedia.api";
import { MAX_MEDIA_PER_OBSERVATION } from "@/features/multimedia/types";

const wizardSchema = z.object({
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
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  notes: z.string().optional(),
  photo_url: z.string().optional(),
  rank: z.string().min(1, "Wybierz range"),
  potential_now: z.coerce.number().int().min(1).max(5),
  potential_future: z.coerce.number().int().min(1).max(5),
  source: z.string().min(1, "Wybierz zrodlo"),
});

type WizardFormValues = z.infer<typeof wizardSchema>;

type PrefillPlayer = {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  club_name?: string;
  primary_position?: string;
};

type ObservationWizardProps = {
  prefillPlayer?: PrefillPlayer;
  lockPlayerFields?: boolean;
  cancelHref?: string;
};

const parseFullName = (value: string) => {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  const lastName = parts.pop() ?? "";
  return { firstName: parts.join(" "), lastName };
};

export function ObservationWizard({
  prefillPlayer,
  lockPlayerFields = false,
  cancelHref = "/observations",
}: ObservationWizardProps) {
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const { addOfflineObservation } = useSync();
  const { mutateAsync: createObservation, isPending: isSaving } = useCreateObservation();
  const { mutateAsync: createPlayer } = useCreatePlayer();
  const { mutateAsync: updatePlayer } = useUpdatePlayer();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const navigate = useNavigate();
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; id: string }[]>([]);
  const [pendingYoutube, setPendingYoutube] = useState<
    { url: string; videoId: string; thumbnailUrl: string }[]
  >([]);
  const auditName =
    (user?.user_metadata as { full_name?: string })?.full_name ??
    user?.email ??
    "Uzytkownik";
  const auditRole =
    (user?.user_metadata as { role?: string })?.role ?? "user";
  const shouldUpdatePlayer = Boolean(prefillPlayer?.id) && !lockPlayerFields;
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/observations");
    }
  };

  const form = useForm<WizardFormValues, unknown, WizardFormValues>({
    resolver: zodResolver(wizardSchema) as Resolver<WizardFormValues>,
    defaultValues: {
      full_name: "",
      age: 16,
      club_name: "",
      competition: "",
      match_date: format(new Date(), "yyyy-MM-dd"),
      primary_position: "",
      overall_rating: 5,
      strengths: "",
      weaknesses: "",
      rank: "",
      potential_now: 3,
      potential_future: 3,
      source: "scouting",
      notes: "",
      photo_url: "",
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
    form.setValue("full_name", `${prefillPlayer.first_name} ${prefillPlayer.last_name}`.trim());
    if (Number.isFinite(prefillPlayer.birth_year)) {
      form.setValue("age", currentYear - prefillPlayer.birth_year);
    }
    form.setValue("club_name", prefillPlayer.club_name ?? "");
    if (prefillPlayer.primary_position) {
      form.setValue("primary_position", mapLegacyPosition(prefillPlayer.primary_position));
    }
  }, [prefillPlayer, form, currentYear]);

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

  const onSubmit = async (values: WizardFormValues) => {
    if (!user) {
      setSubmitError("Brak zalogowanego uzytkownika");
      return;
    }
    setSubmitError(null);
    const { firstName, lastName } = parseFullName(values.full_name);
    const birthYear = currentYear - values.age;
    try {
      const nowIso = new Date().toISOString();
      if (!isOnline) {
        await addOfflineObservation({
          localId: uuidv4(),
          data: {
            player_id: prefillPlayer?.id,
            scout_id: user.id,
            first_name: firstName,
            last_name: lastName,
            birth_year: birthYear,
            club_name: values.club_name?.trim(),
            primary_position: values.primary_position,
            should_update_player: shouldUpdatePlayer,
            source: values.source as ObservationSource,
            rank: values.rank,
            notes: values.notes,
            potential_now: values.potential_now,
            potential_future: values.potential_future,
            observation_date: values.match_date,
            competition: values.competition?.trim(),
            overall_rating: values.overall_rating,
            strengths: values.strengths?.trim(),
            weaknesses: values.weaknesses?.trim(),
            photo_url: values.photo_url?.trim(),
            created_by: user.id,
            created_by_name: auditName,
            created_by_role: auditRole,
            updated_by: user.id,
            updated_by_name: auditName,
            updated_by_role: auditRole,
            updated_at: nowIso,
          },
          createdAt: new Date(),
          syncStatus: "pending",
          syncAttempts: 0,
        });
        toast({
          title: "Zapisano obserwacje",
          description: "Obserwacja zostala zapisana offline.",
        });
      } else {
        let playerId = prefillPlayer?.id;
        if (playerId && shouldUpdatePlayer) {
          const clubId = await resolveClubId(values.club_name?.trim());
          await updatePlayer({
            id: playerId,
            input: {
              first_name: firstName,
              last_name: lastName,
              birth_year: birthYear,
              club_id: clubId ?? null,
              primary_position: values.primary_position,
            },
          });
        }
        if (!playerId) {
          const clubId = await resolveClubId(values.club_name?.trim());
          const player = await createPlayer({
            first_name: firstName,
            last_name: lastName,
            birth_year: birthYear,
            club_id: clubId,
            primary_position: values.primary_position,
            pipeline_status: "unassigned",
          });
          playerId = player.id;
        }

        const observation = await createObservation({
          player_id: playerId,
          scout_id: user.id,
          source: values.source as ObservationSource,
          rank: values.rank,
          notes: values.notes,
          potential_now: values.potential_now,
          potential_future: values.potential_future,
          observation_date: values.match_date,
          competition: values.competition?.trim() || null,
          overall_rating: values.overall_rating,
          strengths: values.strengths?.trim() || null,
          weaknesses: values.weaknesses?.trim() || null,
          photo_url: values.photo_url?.trim() || null,
          created_by: user.id,
          created_by_name: auditName,
          created_by_role: auditRole,
          updated_by: user.id,
          updated_by_name: auditName,
          updated_by_role: auditRole,
          updated_at: nowIso,
        });
        if (pendingFiles.length > 0 || pendingYoutube.length > 0) {
          try {
            for (const { file } of pendingFiles) {
              await uploadMediaFile({
                file,
                playerId: observation.player_id,
                observationId: observation.id,
                createdBy: user.id,
              });
            }
            for (const y of pendingYoutube) {
              await addYoutubeLink({
                playerId: observation.player_id,
                observationId: observation.id,
                youtubeUrl: y.url,
                videoId: y.videoId,
                createdBy: user.id,
                thumbnailUrl: y.thumbnailUrl,
              });
            }
          } catch (mediaErr) {
            console.error("Multimedia upload failed:", mediaErr);
            toast({
              variant: "destructive",
              title: "Obserwacja zapisana",
              description: "Nie wszystkie multimedia zostaly dodane. Sprobuj dodac je w edycji.",
            });
          }
        }
        toast({
          title: "Zapisano obserwacje",
          description: "Zmiany zostaly poprawnie zapisane.",
        });
      }

      form.reset();
      setPendingFiles([]);
      setPendingYoutube([]);
      localStorage.removeItem("scoutpro-observation-draft");
      goBack();
    } catch {
      setSubmitError("Nie udalo sie zapisac obserwacji");
      toast({
        variant: "destructive",
        title: "Nie udalo sie zapisac",
        description: "Sprobuj ponownie za chwile.",
      });
    }
  };

  const handleSaveDraft = () => {
    const values = form.getValues();
    localStorage.setItem("scoutpro-observation-draft", JSON.stringify(values));
  };

  const handleInvalid = (errors: FieldErrors<WizardFormValues>) => {
    const firstField = Object.keys(errors)[0] as keyof WizardFormValues | undefined;
    if (firstField) {
      form.setFocus(firstField);
    }
  };

  return (
    <div className="space-y-4">
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
                      <Input
                        placeholder="Jan Kowalski"
                        disabled={lockPlayerFields && Boolean(field.value?.trim())}
                        {...field}
                      />
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
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={8}
                        max={50}
                        disabled={lockPlayerFields && typeof field.value === "number" && !Number.isNaN(field.value)}
                        {...field}
                      />
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
                        disabled={lockPlayerFields && Boolean(field.value?.trim())}
                      />
                    </FormControl>
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={lockPlayerFields && Boolean(field.value)}
                    >
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
                    <PositionPickerDialog
                      value={field.value}
                      onSelect={field.onChange}
                      disabled={lockPlayerFields && Boolean(field.value)}
                    />
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
                  const ratingLabel = Number.isInteger(ratingValue) ? ratingValue.toString() : ratingValue.toFixed(1);

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
                    <Select value={field.value} onValueChange={field.onChange}>
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
            <h2 className="text-sm font-semibold text-slate-700">Multimedia</h2>
            <p className="text-sm text-slate-600">
              Zdjęcia, wideo lub linki YouTube zostana dolaczone do obserwacji po jej zapisaniu.
            </p>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setMediaModalOpen(true)}
            >
              + Dodaj multimedia
            </Button>
            <MediaPreview
              pendingFiles={pendingFiles}
              pendingYoutube={pendingYoutube}
              savedMedia={[]}
              onRemovePending={(id) => setPendingFiles((prev) => prev.filter((p) => p.id !== id))}
              onRemoveYoutube={(index) =>
                setPendingYoutube((prev) => prev.filter((_, i) => i !== index))
              }
              onRemoveSaved={() => {}}
            />
            <MediaUploadModal
              open={mediaModalOpen}
              onOpenChange={setMediaModalOpen}
              maxFiles={MAX_MEDIA_PER_OBSERVATION}
              currentCount={pendingFiles.length + pendingYoutube.length}
              onFilesSelected={(files) =>
                setPendingFiles((prev) => [
                  ...prev,
                  ...files.map((file) => ({ file, id: uuidv4() })),
                ])
              }
              onYoutubeAdd={({ url, videoId, thumbnailUrl }) =>
                setPendingYoutube((prev) => [...prev, { url, videoId, thumbnailUrl }])
              }
            />
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

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                Zapisz szkic
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to={cancelHref}>Anuluj</Link>
              </Button>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Zapisz obserwacje"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
