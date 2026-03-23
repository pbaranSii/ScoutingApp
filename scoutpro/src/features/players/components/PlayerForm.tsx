import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePipelineHistory, useCreatePlayer, useUpdatePlayer } from "../hooks/usePlayers";
import type { DominantFoot, PipelineStatus } from "../types";
import { ClubSelect } from "./ClubSelect";
import { PositionDictionarySelect } from "./PositionDictionarySelect";
import { PositionPickerDialog } from "@/features/players/components/PositionPickerDialog";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ALL_PIPELINE_STATUSES } from "@/features/pipeline/types";
import { mapLegacyPosition } from "@/features/players/positions";
import { codeForLookup } from "@/features/players/components/PositionDictionarySelect";
import { useBodyBuild, useCategoriesForCurrentArea } from "@/features/dictionaries/hooks/useDictionaries";
import {
  MediaUploadModal,
  useUploadMediaFile,
  useAddYoutubeLink,
  useMultimediaByPlayer,
  getMultimediaPublicUrl,
  getYoutubeThumbnailUrl,
} from "@/features/multimedia";
import { useObservationsByPlayer } from "@/features/observations/hooks/useObservations";
import { MAX_MEDIA_PER_OBSERVATION } from "@/features/multimedia/types";
import { format, parseISO } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { Film, Image as ImageIcon, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().positive().optional()
);

const playerSchema = z.object({
  first_name: z.string().min(2, "Podaj imię"),
  last_name: z.string().min(2, "Podaj nazwisko"),
  birth_year: z.coerce.number().int().min(2000).max(2030),
  birth_date: z
    .string()
    .optional()
    .refine(
      (s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s),
      "Podaj datę urodzenia w formacie RRRR-MM-DD"
    ),
  contract_end_date: z
    .string()
    .optional()
    .refine(
      (s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s),
      "Podaj datę końca kontraktu w formacie RRRR-MM-DD"
    ),
  nationality: optionalText,
  club_name: optionalText,
  age_category_id: optionalText,
  primary_position: optionalText,
  dominant_foot: optionalText,
  pipeline_status: optionalText,
  body_build: optionalText,
  height_cm: optionalNumber,
  weight_kg: optionalNumber,
  guardian_name: optionalText,
  guardian_phone: optionalText,
  guardian_email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email("Podaj poprawny email").optional()
  ),
  agent_name: optionalText,
  agent_phone: optionalText,
  agent_email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email("Podaj poprawny email").optional()
  ),
  transfermarkt_url: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Podaj poprawny URL").optional()
  ),
  facebook_url: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Podaj poprawny URL").optional()
  ),
  instagram_url: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Podaj poprawny URL").optional()
  ),
  other_social_url: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Podaj poprawny URL").optional()
  ),
  photo_url: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Podaj poprawny URL").optional()
  ),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

type PlayerFormProps = {
  mode?: "create" | "edit";
  playerId?: string;
  initialValues?: Partial<PlayerFormValues>;
  onCreated?: () => void;
  onUpdated?: () => void;
};

export function PlayerForm({
  mode = "create",
  playerId,
  initialValues,
  onCreated,
  onUpdated,
}: PlayerFormProps) {
  const isEdit = mode === "edit";
  const navigate = useNavigate();
  const { mutateAsync: createPlayer, isPending: isCreating } = useCreatePlayer();
  const { mutateAsync: updatePlayer, isPending: isUpdating } = useUpdatePlayer();
  const { mutateAsync: createHistory } = useCreatePipelineHistory();
  const { user } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [addMediaModalOpen, setAddMediaModalOpen] = useState(false);
  const [profileMediaObservationId, setProfileMediaObservationId] = useState<string | null>(null);
  const { data: bodyBuildOptions = [] } = useBodyBuild();
  const { data: categories = [] } = useCategoriesForCurrentArea();
  const { data: observations = [] } = useObservationsByPlayer(isEdit && playerId ? playerId : "");
  const { data: mediaItems = [] } = useMultimediaByPlayer(isEdit && playerId ? playerId : "");
  const uploadProfileMedia = useUploadMediaFile(
    isEdit && playerId ? playerId : "",
    profileMediaObservationId
  );
  const addProfileYoutube = useAddYoutubeLink(
    isEdit && playerId ? playerId : "",
    profileMediaObservationId
  );

  const defaultValues = useMemo(() => {
    const normalizedInitial: PlayerFormValues = {
      ...initialValues,
      first_name: initialValues?.first_name ?? "",
      last_name: initialValues?.last_name ?? "",
      birth_year: initialValues?.birth_year ?? new Date().getFullYear() - 14,
      birth_date: initialValues?.birth_date ?? "",
      contract_end_date: (initialValues as { contract_end_date?: string | null } | undefined)?.contract_end_date ?? "",
      nationality: initialValues?.nationality ?? "Polska",
      club_name: initialValues?.club_name ?? "",
      age_category_id: (initialValues as { age_category_id?: string | null } | undefined)?.age_category_id ?? "",
      primary_position: mapLegacyPosition(initialValues?.primary_position ?? ""),
      dominant_foot: initialValues?.dominant_foot ?? "",
      pipeline_status: initialValues?.pipeline_status ?? "unassigned",
      body_build: initialValues?.body_build ?? "",
      height_cm: initialValues?.height_cm ?? undefined,
      weight_kg: initialValues?.weight_kg ?? undefined,
      guardian_name: initialValues?.guardian_name ?? "",
      guardian_phone: initialValues?.guardian_phone ?? "",
      guardian_email: initialValues?.guardian_email ?? "",
      agent_name: initialValues?.agent_name ?? "",
      agent_phone: initialValues?.agent_phone ?? "",
      agent_email: initialValues?.agent_email ?? "",
      transfermarkt_url: initialValues?.transfermarkt_url ?? "",
      facebook_url: initialValues?.facebook_url ?? "",
      instagram_url: initialValues?.instagram_url ?? "",
      other_social_url: initialValues?.other_social_url ?? "",
      photo_url: initialValues?.photo_url ?? "",
    };

    const defaults: PlayerFormValues = {
      first_name: "",
      last_name: "",
      birth_year: new Date().getFullYear() - 14,
      birth_date: "",
      contract_end_date: "",
      nationality: "Polska",
      club_name: "",
      age_category_id: "",
      primary_position: "",
      dominant_foot: "",
      pipeline_status: "unassigned",
      body_build: "",
      height_cm: undefined,
      weight_kg: undefined,
      guardian_name: "",
      guardian_phone: "",
      guardian_email: "",
      agent_name: "",
      agent_phone: "",
      agent_email: "",
      transfermarkt_url: "",
      facebook_url: "",
      instagram_url: "",
      other_social_url: "",
      photo_url: "",
    };

    return {
      ...defaults,
      ...normalizedInitial,
      primary_position: mapLegacyPosition(normalizedInitial.primary_position ?? ""),
    };
  }, [initialValues]);

  const resolveAgeCategoryId = (birthYear: number): string | null => {
    const y = Number(birthYear);
    if (!Number.isFinite(y)) return null;

    const cats = (categories ?? []) as Array<Record<string, unknown>>;
    const candidates = cats
      .map((c) => {
        const ageUnder = c.age_under ?? null;
        const minBy = c.min_birth_year ?? null;
        const maxBy = c.max_birth_year ?? null;

        const matchesAgeUnder = ageUnder != null && y === new Date().getFullYear() - Number(ageUnder);
        const matchesRange =
          minBy != null &&
          maxBy != null &&
          y >= Number(minBy) &&
          y <= Number(maxBy);

        return { c, matchesAgeUnder, matchesRange };
      })
      .filter((x) => x.matchesAgeUnder || x.matchesRange);

    candidates.sort((a, b) => {
      const aHasUnder = a.c.age_under != null;
      const bHasUnder = b.c.age_under != null;
      if (aHasUnder !== bHasUnder) return aHasUnder ? -1 : 1;

      const aMax = a.c.max_birth_year ?? null;
      const bMax = b.c.max_birth_year ?? null;
      if ((aMax == null) !== (bMax == null)) return aMax == null ? 1 : -1;
      if (aMax != null && bMax != null && aMax !== bMax) return Number(bMax) - Number(aMax);

      const aMin = a.c.min_birth_year ?? null;
      const bMin = b.c.min_birth_year ?? null;
      if ((aMin == null) !== (bMin == null)) return aMin == null ? 1 : -1;
      if (aMin != null && bMin != null && aMin !== bMin) return Number(bMin) - Number(aMin);

      return 0;
    });

    const id = candidates[0]?.c?.id;
    if (typeof id === "string" && id.length > 0) return id;

    // Fallback: dla obszarów (np. SENIOR) kategorie czasem nie mają kompletnej logiki wiekowej
    // (age_under/min/max). Wtedy bierzemy pierwszą dostępną kategorię z bieżącego obszaru.
    const fallbackId = (categories as Array<{ id?: unknown }>)?.[0]?.id;
    return typeof fallbackId === "string" && fallbackId.length > 0 ? fallbackId : null;
  };

  const form = useForm<PlayerFormValues, unknown, PlayerFormValues>({
    resolver: zodResolver(playerSchema) as Resolver<PlayerFormValues>,
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

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

  const onSubmit = async (values: PlayerFormValues) => {
    setSubmitError(null);
    try {
      const clubId = await resolveClubId(values.club_name?.trim());
      const toNullable = (value?: string) =>
        typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
      const toNullableNumber = (value?: number) =>
        typeof value === "number" && !Number.isNaN(value) ? value : null;
      const dominantFoot = values.dominant_foot
        ? (values.dominant_foot as DominantFoot)
        : null;
      const pipelineStatus = values.pipeline_status
        ? (values.pipeline_status as PipelineStatus)
        : undefined;

      // `age_category_id` jest wymagane przez RLS (musi należeć do bieżącego obszaru).
      // Nie polegamy wyłącznie na kategoriach z UI (mogą być puste w czasie ładowania),
      // tylko wyliczamy fallback na podstawie `current_area_access()` w bazie.
      let resolvedAgeCategoryId: string | null = toNullable(values.age_category_id);

      if (!resolvedAgeCategoryId) {
        // Funkcja pozostaje jako "heurystyka" dla UI; główny fallback i tak robimy po stronie bazy.
        void resolveAgeCategoryId(values.birth_year);
        const { data: areaAccessRaw, error: areaAccessErr } = await (supabase as any).rpc(
          "current_area_access"
        );
        if (areaAccessErr) throw areaAccessErr;

        const areaAccess = areaAccessRaw as "AKADEMIA" | "SENIOR" | "ALL" | null;
        let categoriesQ = (supabase as any)
          .from("categories")
          .select("id, age_under, min_birth_year, max_birth_year")
          .eq("is_active", true);

        if (areaAccess && areaAccess !== "ALL") {
          categoriesQ = categoriesQ.eq("area", areaAccess);
        }

        const { data: areaCats, error: catsErr } = await categoriesQ.limit(20);
        if (catsErr) throw catsErr;

        const cats = (areaCats ?? []) as Array<{
          id: string;
          age_under?: number | null;
          min_birth_year?: number | null;
          max_birth_year?: number | null;
        }>;

        const yearNow = new Date().getFullYear();
        const y = Number(values.birth_year);

        const candidates = cats
          .map((c) => {
            const ageUnder = c.age_under ?? null;
            const minBy = c.min_birth_year ?? null;
            const maxBy = c.max_birth_year ?? null;
            const matchesAgeUnder =
              ageUnder != null && y === yearNow - Number(ageUnder);
            const matchesRange =
              minBy != null &&
              maxBy != null &&
              Number.isFinite(Number(minBy)) &&
              Number.isFinite(Number(maxBy)) &&
              y >= Number(minBy) &&
              y <= Number(maxBy);
            return { c, matchesAgeUnder, matchesRange, hasAgeUnder: ageUnder != null };
          })
          .filter((x) => x.matchesAgeUnder || x.matchesRange);

        candidates.sort((a, b) => {
          if (a.hasAgeUnder !== b.hasAgeUnder) return a.hasAgeUnder ? -1 : 1;
          const aMax = a.c.max_birth_year ?? null;
          const bMax = b.c.max_birth_year ?? null;
          if ((aMax == null) !== (bMax == null)) return aMax == null ? 1 : -1;
          if (aMax != null && bMax != null && aMax !== bMax) return Number(bMax) - Number(aMax);
          const aMin = a.c.min_birth_year ?? null;
          const bMin = b.c.min_birth_year ?? null;
          if ((aMin == null) !== (bMin == null)) return aMin == null ? 1 : -1;
          if (aMin != null && bMin != null && aMin !== bMin) return Number(bMin) - Number(aMin);
          return 0;
        });

        const idFromCandidates = candidates[0]?.c?.id ?? null;
        const idFromFallback = cats[0]?.id ?? null;
        resolvedAgeCategoryId =
          (typeof idFromCandidates === "string" && idFromCandidates.length > 0 ? idFromCandidates : null) ??
          (typeof idFromFallback === "string" && idFromFallback.length > 0 ? idFromFallback : null);
      }

      if (!resolvedAgeCategoryId) {
        throw new Error(
          "Nie udało się ustalić kategorii wiekowej dla bieżącego obszaru. Zmień rocznik lub wybierz kategorię."
        );
      }
      const input = {
        first_name: values.first_name,
        last_name: values.last_name,
        birth_year: values.birth_year,
        age_category_id: resolvedAgeCategoryId,
        birth_date: toNullable(values.birth_date),
        contract_end_date: toNullable(values.contract_end_date),
        club_id: clubId ?? null,
        nationality: toNullable(values.nationality),
        primary_position: toNullable(codeForLookup(values.primary_position) || values.primary_position?.trim()),
        dominant_foot: dominantFoot,
        pipeline_status: pipelineStatus ?? "unassigned",
        body_build: toNullable(values.body_build),
        height_cm: toNullableNumber(values.height_cm),
        weight_kg: toNullableNumber(values.weight_kg),
        guardian_name: toNullable(values.guardian_name),
        guardian_phone: toNullable(values.guardian_phone),
        guardian_email: toNullable(values.guardian_email),
        agent_name: toNullable(values.agent_name),
        agent_phone: toNullable(values.agent_phone),
        agent_email: toNullable(values.agent_email),
        transfermarkt_url: toNullable(values.transfermarkt_url),
        facebook_url: toNullable(values.facebook_url),
        instagram_url: toNullable(values.instagram_url),
        other_social_url: toNullable(values.other_social_url),
        photo_urls: values.photo_url?.trim() ? [values.photo_url.trim()] : null,
      };

      if (isEdit) {
        if (!playerId) {
          throw new Error("Brak identyfikatora zawodnika do aktualizacji.");
        }
        await updatePlayer({ id: playerId, input });
        if (user?.id && pipelineStatus && pipelineStatus !== initialValues?.pipeline_status) {
          try {
            await createHistory({
              player_id: playerId,
              from_status: initialValues?.pipeline_status ?? null,
              to_status: pipelineStatus,
              changed_by: user.id,
            });
          } catch (error) {
            console.warn("Pipeline history insert blocked:", error);
          }
        }
        toast({
          title: "Zapisano zmiany",
          description: "Profil zawodnika zostal zaktualizowany.",
        });
        onUpdated?.();
      } else {
        const created = await createPlayer(input);
        if (user?.id && input.pipeline_status) {
          try {
            await createHistory({
              player_id: created.id,
              from_status: null,
              to_status: input.pipeline_status,
              changed_by: user.id,
            });
          } catch (error) {
            console.warn("Pipeline history insert blocked:", error);
          }
        }
        toast({
          title: "Zapisano zawodnika",
          description: "Nowy zawodnik zostal dodany.",
        });
        form.reset();
        onCreated?.();
      }
    } catch (error) {
      const message = extractErrorMessage(error, "Nie udało się zapisać zawodnika");
      console.error("Save player failed:", error);
      setSubmitError(message);
      toast({
        variant: "destructive",
        title: "Nie udało się zapisać",
        description: message,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Dane podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imię *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwisko *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kowalski" {...field} />
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
                    <FormLabel>Rok urodzenia *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data urodzenia</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contract_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Koniec kontraktu</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narodowosc</FormLabel>
                    <FormControl>
                      <Input placeholder="Polska" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Portale społecznościowe</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="transfermarkt_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TransferMarkt (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.transfermarkt.pl/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebook_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.facebook.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.instagram.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="other_social_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inne (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Pozycja i klub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primary_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pozycja</FormLabel>
                    <div className="flex items-center gap-2">
                      <PositionDictionarySelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Wybierz pozycję"
                        className="flex-1"
                      />
                      <PositionPickerDialog value={field.value} onSelect={field.onChange} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="club_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktualny klub</FormLabel>
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
                name="age_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoria wiekowa</FormLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz kategorię" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">— Brak —</SelectItem>
                        {(categories as { id: string; name?: string }[]).map((c) => (
                          <SelectItem key={String(c.id)} value={String(c.id)}>
                            {String(c.name ?? c.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="pipeline_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status zawodnika</FormLabel>
                  <Select value={field.value ?? "unassigned"} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Parametry fizyczne</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="body_build"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budowa ciała</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(bodyBuildOptions as { code?: string; name_pl?: string }[]).map((opt) => (
                        <SelectItem key={String(opt.code)} value={String(opt.code ?? "")}>
                          {String(opt.name_pl ?? opt.code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="height_cm"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                <FormItem>
                  <FormLabel>Wzrost (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" value={value ?? ""} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                <FormItem>
                  <FormLabel>Waga (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" value={value ?? ""} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="dominant_foot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferowana noga</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="right">Prawa</SelectItem>
                      <SelectItem value="left">Lewa</SelectItem>
                      <SelectItem value="both">Obie</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Dane kontaktowe (opcjonalne)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="guardian_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rodzic/Opiekun</FormLabel>
                    <FormControl>
                      <Input placeholder="Adam Kowalski" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guardian_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+48 600 123 456" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="guardian_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="adam.kowalski@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Dane kontaktowe agenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent (imię i nazwisko lub nazwa)</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan Kowalski" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agent_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+48 600 123 456" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="agent_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="agent@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {isEdit && playerId && (
          <Card>
            <CardHeader className="px-6">
              <CardTitle className="text-base">Zdjęcia i multimedia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-6">
              <p className="text-sm text-slate-600">
                Dodaj zdjęcia lub wideo do profilu zawodnika. Możesz też przypisać je do obserwacji.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddMediaModalOpen(true)}
              >
                Dodaj zdjęcia lub multimedia
              </Button>
              {(mediaItems?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Dodane do profilu ({mediaItems?.length ?? 0})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(mediaItems ?? []).map((m) => {
                      const thumbSrc =
                        m.file_type === "youtube_link" && m.youtube_video_id
                          ? getYoutubeThumbnailUrl(m.youtube_video_id)
                          : m.storage_path
                            ? getMultimediaPublicUrl(m.storage_path)
                            : null;
                      const label =
                        m.file_type === "youtube_link" ? "YouTube" : (m.file_name ?? "Plik");
                      return (
                        <div
                          key={m.id}
                          className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-1.5"
                        >
                          <div className="h-16 w-16 overflow-hidden rounded bg-slate-100">
                            {thumbSrc ? (
                              <img
                                src={thumbSrc}
                                alt={label}
                                className="h-full w-full object-cover"
                                referrerPolicy={m.file_type === "youtube_link" ? "no-referrer" : undefined}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                {m.file_type === "youtube_link" ? (
                                  <Link2 className="h-6 w-6 text-slate-400" />
                                ) : m.file_type === "video" ? (
                                  <Film className="h-6 w-6 text-slate-400" />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-slate-400" />
                                )}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 max-w-[88px] truncate text-xs text-slate-600">
                            {label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500">
                    Pełna galeria na podglądzie profilu zawodnika.
                  </p>
                </div>
              )}
              <MediaUploadModal
                open={addMediaModalOpen}
                onOpenChange={setAddMediaModalOpen}
                title="Dodaj multimedia do profilu zawodnika"
                maxFiles={MAX_MEDIA_PER_OBSERVATION}
                currentCount={mediaItems?.length ?? 0}
                observationOptions={observations.map((o) => ({
                  value: o.id,
                  label: `${o.competition ?? "Obserwacja"} ${format(parseISO(o.observation_date ?? ""), "dd.MM.yyyy")}`,
                }))}
                selectedObservationId={profileMediaObservationId}
                onObservationIdChange={setProfileMediaObservationId}
                onFilesSelected={async (files) => {
                  if (!user?.id) return;
                  for (const file of files) {
                    try {
                      await uploadProfileMedia.mutateAsync({ file, createdBy: user.id });
                      toast({ title: "Plik dodany" });
                    } catch {
                      toast({
                        variant: "destructive",
                        title: "Nie udało się dodać pliku",
                      });
                    }
                  }
                }}
                onYoutubeAdd={async ({ url, videoId, thumbnailUrl }) => {
                  if (!user?.id) return;
                  try {
                    await addProfileYoutube.mutateAsync({
                      youtubeUrl: url,
                      videoId,
                      createdBy: user.id,
                      thumbnailUrl,
                    });
                    toast({ title: "Link YouTube dodany" });
                  } catch {
                    toast({
                      variant: "destructive",
                      title: "Nie udało się dodać linku",
                    });
                  }
                }}
              />
            </CardContent>
          </Card>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/players/${playerId ?? ""}` : "/players")}
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating
              ? "Zapisywanie..."
              : isEdit
                ? "Zapisz zmiany"
                : "Zapisz zawodnika"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}
