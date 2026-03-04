import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useCreateObservation, useUpdateObservation } from "../hooks/useObservations";
import type { ObservationSource } from "../types";
import {
  fetchEvaluationCriteriaByPositionCode,
  type EvaluationCriterion,
} from "../api/evaluationCriteria.api";
import {
  fetchObservationCriterionNotes,
  replaceObservationCriterionNotes,
} from "../api/observationCriterionNotes.api";
import { useQuery } from "@tanstack/react-query";
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
import {
  PositionDictionarySelect,
  getPositionOptionsFromDictionary,
  getPositionLabelFromDictionary,
  codeForLookup,
} from "@/features/players/components/PositionDictionarySelect";
import { usePositionDictionary } from "@/features/tactical/hooks/usePositionDictionary";
import { mapLegacyPosition } from "@/features/players/positions";
import { checkDuplicatePlayers } from "@/features/players/api/players.api";
import type { DuplicateCandidate } from "@/features/players/api/players.api";
import type { PlayerSearchItem } from "@/features/players/api/players.api";
import { usePlayerSources, useStrengths, useWeaknesses, useCategories } from "@/features/dictionaries/hooks/useDictionaries";
import { StrengthsWeaknessesTagField } from "./StrengthsWeaknessesTagField";
import { PlayerSearchDialog } from "./PlayerSearchDialog";
import { DuplicateWarningDialog } from "./DuplicateWarningDialog";
import { toast } from "@/hooks/use-toast";
import { MediaPreview, MediaUploadModal } from "@/features/multimedia";
import type { Multimedia } from "@/features/multimedia/types";
import { uploadMediaFile, addYoutubeLink } from "@/features/multimedia/api/multimedia.api";
import { MAX_MEDIA_PER_OBSERVATION } from "@/features/multimedia/types";

const CURRENT_YEAR = new Date().getFullYear();
/** Domyślny rok urodzenia dla nowego zawodnika w formularzu obserwacji */
const DEFAULT_BIRTH_YEAR = 2010;

const wizardSchema = z
  .object({
    player_id: z.string().uuid().optional().nullable(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    age: z
      .coerce.number()
      .int()
      .min(CURRENT_YEAR - 50, "Podaj poprawny rok urodzenia (wiek 8–50)")
      .max(CURRENT_YEAR - 8, "Podaj poprawny rok urodzenia (wiek 8–50)")
      .optional(),
    club_name: z.string().optional(),
    competition: z.string().optional(),
    match_date: z.string().min(1, "Wybierz date meczu"),
    match_result: z
      .string()
      .optional()
      .transform((s) => (s ?? "").trim())
      .refine(
        (s) => s === "" || /^\d{1,2}[-:]\d{1,2}$/.test(s),
        "Format: X-Y lub X:Y (np. 2-1 lub 2:1)"
      ),
    location: z.string().max(200).optional(),
    primary_position: z.string().min(1, "Wybierz pozycje"),
    additional_positions: z.array(z.string()).optional(),
    technical_rating: z.coerce.number().int().min(1).max(5),
    speed_rating: z.coerce.number().int().min(1).max(5),
    motor_rating: z.coerce.number().int().min(1).max(5),
    tactical_rating: z.coerce.number().int().min(1).max(5),
    mental_rating: z.coerce.number().int().min(1).max(5),
    potential_now: z.coerce.number().int().min(1).max(5),
    potential_future: z.coerce.number().int().min(1).max(5),
    overall_rating: z.coerce.number().min(1).max(10).optional(),
    strengths: z.string().optional(),
    weaknesses: z.string().optional(),
    motor_speed_rating: z.coerce.number().int().min(1).max(5),
    motor_endurance_rating: z.coerce.number().int().min(1).max(5),
    motor_jump_rating: z.coerce.number().int().min(1).max(5),
    motor_agility_rating: z.coerce.number().int().min(1).max(5),
    motor_acceleration_rating: z.coerce.number().int().min(1).max(5),
    motor_strength_rating: z.coerce.number().int().min(1).max(5),
    photo_url: z.string().optional(),
    rank: z.string().min(1, "Wybierz range"),
    source: z.string().min(1, "Wybierz zrodlo"),
    form_type: z.enum(["simplified", "extended"]).optional(),
    summary: z
      .string()
      .max(5000)
      .optional()
      .refine(
        (s) => s === undefined || s.trim().length === 0 || s.trim().length >= 10,
        "Min. 10 znaków"
      ),
    recommendation: z.enum(["positive", "to_observe", "negative"]).optional(),
    match_performance_rating: z.coerce.number().int().min(1).max(5).optional(),
    motor_description: z.string().max(2000).optional(),
    birth_date: z
      .string()
      .optional()
      .refine(
        (s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s),
        "Podaj datę urodzenia w formacie RRRR-MM-DD"
      ),
  })
  .superRefine((data, ctx) => {
    if (data.player_id) return;
    const firstName = (data.first_name ?? "").trim();
    const lastName = (data.last_name ?? "").trim();
    if (firstName.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Podaj imię",
        path: ["first_name"],
      });
    }
    if (lastName.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Podaj nazwisko",
        path: ["last_name"],
      });
    }
    const birthYear = data.age;
    if (
      !Number.isFinite(birthYear) ||
      (birthYear ?? 0) < CURRENT_YEAR - 50 ||
      (birthYear ?? 0) > CURRENT_YEAR - 8
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Podaj poprawny rok urodzenia (wiek 8–50)",
        path: ["age"],
      });
    }
    if (data.birth_date && data.birth_date.trim()) {
      const yearFromDate = parseInt(data.birth_date.slice(0, 4), 10);
      if (Number.isFinite(data.age) && yearFromDate !== data.age) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rok w dacie urodzenia musi być zgodny z rokiem urodzenia",
          path: ["birth_date"],
        });
      }
    }
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
  mode?: "create" | "edit";
  observationId?: string;
  initialValues?: Partial<WizardFormValues>;
  prefillPlayer?: PrefillPlayer;
  lockPlayerFields?: boolean;
  cancelHref?: string;
  /** Domyślny typ formularza w trybie tworzenia (np. extended dla obserwacji indywidualnej). */
  defaultFormType?: "simplified" | "extended";
  /** Zapisane multimedia (dla trybu edycji – zaciągane z obserwacji). */
  savedMedia?: Multimedia[];
  /** Callback usunięcia zapisanego medium (np. wywołanie deleteMultimedia). */
  onRemoveSavedMedia?: (id: string) => void;
};

export function ObservationWizard({
  mode = "create",
  observationId,
  initialValues,
  prefillPlayer,
  lockPlayerFields = false,
  cancelHref = "/observations",
  defaultFormType,
  savedMedia = [],
  onRemoveSavedMedia,
}: ObservationWizardProps) {
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const { data: playerSources = [] } = usePlayerSources();
  const { data: categoriesOptions = [] } = useCategories();
  const { data: strengthsOptions = [] } = useStrengths();
  const { data: weaknessesOptions = [] } = useWeaknesses();
  const { addOfflineObservation } = useSync();
  const { mutateAsync: createObservation, isPending: isCreatePending } = useCreateObservation();
  const { mutateAsync: updateObservation, isPending: isUpdatePending } = useUpdateObservation();
  const isSaving = isCreatePending || isUpdatePending;
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
    "Użytkownik";
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

  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);
  const [criterionNotes, setCriterionNotes] = useState<Record<string, string>>({});

  const form = useForm<WizardFormValues, unknown, WizardFormValues>({
    resolver: zodResolver(wizardSchema) as Resolver<WizardFormValues>,
    defaultValues: {
      player_id: null,
      first_name: "",
      last_name: "",
      age: DEFAULT_BIRTH_YEAR,
      club_name: "",
      competition: "",
      match_date: format(new Date(), "yyyy-MM-dd"),
      match_result: "",
      location: "",
      primary_position: "",
      additional_positions: [],
      technical_rating: 3,
      speed_rating: 3,
      motor_rating: 3,
      tactical_rating: 3,
      mental_rating: 3,
      potential_now: 3,
      potential_future: 3,
      motor_speed_rating: 3,
      motor_endurance_rating: 3,
      motor_jump_rating: 3,
      motor_agility_rating: 3,
      motor_acceleration_rating: 3,
      motor_strength_rating: 3,
      overall_rating: undefined,
      strengths: "",
      weaknesses: "",
      rank: "B",
      source: "scouting",
      photo_url: "",
      form_type: defaultFormType ?? "simplified",
      summary: "",
      recommendation: undefined,
      match_performance_rating: undefined,
      birth_date: "",
      motor_description: "",
    },
  });

  const primaryPosition = form.watch("primary_position");
  const formType = form.watch("form_type") ?? "simplified";
  const { data: positions = [] } = usePositionDictionary(true);
  const positionOptions = useMemo(() => {
    const all = getPositionOptionsFromDictionary(positions);
    const seen = new Set<string>();
    return all.filter((opt) => {
      if (opt.value === primaryPosition || seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [positions, primaryPosition]);
  const { data: positionCriteria = [] } = useQuery({
    queryKey: ["evaluation-criteria", primaryPosition],
    queryFn: () => fetchEvaluationCriteriaByPositionCode(primaryPosition || ""),
    enabled: Boolean(primaryPosition?.trim()),
  });

  const isEditMode = mode === "edit" && Boolean(observationId);
  const { data: existingCriterionNotes } = useQuery({
    queryKey: ["observation-criterion-notes", observationId],
    queryFn: () => fetchObservationCriterionNotes(observationId!),
    enabled: isEditMode && formType === "extended",
  });

  useEffect(() => {
    if (isEditMode && initialValues) {
      form.reset(initialValues as WizardFormValues);
    }
  }, [isEditMode, initialValues, form]);

  useEffect(() => {
    if (isEditMode && existingCriterionNotes?.length) {
      const next: Record<string, string> = {};
      for (const { criteria_id, description } of existingCriterionNotes) {
        next[criteria_id] = description ?? "";
      }
      setCriterionNotes(next);
    }
  }, [isEditMode, existingCriterionNotes]);

  useEffect(() => {
    if (isEditMode) return;
    const stored = localStorage.getItem("scoutpro-observation-draft");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        if (parsed.full_name != null && (parsed.first_name == null || parsed.last_name == null)) {
          const parts = String(parsed.full_name).trim().split(/\s+/).filter(Boolean);
          parsed.first_name = parts.length >= 2 ? parts.slice(0, -1).join(" ") : parts[0] ?? "";
          parsed.last_name = parts.length >= 2 ? (parts.pop() ?? "") : parts[0] ?? "";
        }
        form.reset(parsed as WizardFormValues);
      } catch {
        localStorage.removeItem("scoutpro-observation-draft");
      }
    }
  }, [form, isEditMode]);

  useEffect(() => {
    if (!prefillPlayer) return;
    form.setValue("player_id", prefillPlayer.id);
    form.setValue("first_name", prefillPlayer.first_name ?? "");
    form.setValue("last_name", prefillPlayer.last_name ?? "");
    if (Number.isFinite(prefillPlayer.birth_year)) {
      form.setValue("age", prefillPlayer.birth_year);
    }
    form.setValue("club_name", prefillPlayer.club_name ?? "");
    if (prefillPlayer.primary_position) {
      form.setValue("primary_position", mapLegacyPosition(prefillPlayer.primary_position));
    }
  }, [prefillPlayer, form, currentYear]);

  const handleSelectPlayer = (player: PlayerSearchItem) => {
    form.setValue("player_id", player.id);
    form.setValue("first_name", player.first_name ?? "");
    form.setValue("last_name", player.last_name ?? "");
    form.setValue("age", player.birth_year);
    form.setValue("club_name", player.club?.name ?? "");
    form.setValue(
      "primary_position",
      player.primary_position ? mapLegacyPosition(player.primary_position) : ""
    );
  };

  const handleAddNewPlayer = (searchQuery?: string) => {
    form.setValue("player_id", null);
    if (searchQuery) {
      const parts = searchQuery.trim().split(/\s+/);
      if (parts.length >= 2) {
        form.setValue("first_name", parts[0] ?? "");
        form.setValue("last_name", parts.slice(1).join(" "));
      } else if (parts.length === 1) {
        form.setValue("first_name", parts[0] ?? "");
        form.setValue("last_name", "");
      }
    }
  };

  const runDuplicateCheck = useCallback(async () => {
    const v = form.getValues();
    if (v.player_id) return;
    const firstName = (v.first_name ?? "").trim();
    const lastName = (v.last_name ?? "").trim();
    if (firstName.length < 1 || lastName.length < 1) return;
    const birthYear = v.age;
    if (
      birthYear == null ||
      !Number.isFinite(birthYear) ||
      birthYear < CURRENT_YEAR - 50 ||
      birthYear > CURRENT_YEAR - 8
    ) {
      return;
    }
    try {
      const candidates = await checkDuplicatePlayers({
        first_name: firstName,
        last_name: lastName,
        birth_year: birthYear,
        current_club: v.club_name?.trim() || undefined,
      });
      const high = candidates.filter((c) => c.score >= 80);
      if (high.length > 0) {
        setDuplicateCandidates(high);
        setDuplicateDialogOpen(true);
      }
    } catch {
      // ignore
    }
  }, [form]);

  const handleConfirmNewDespiteDuplicates = () => {
    setIgnoreDuplicates(true);
    setDuplicateDialogOpen(false);
  };

  const handleSelectExistingFromDuplicate = (player: DuplicateCandidate) => {
    form.setValue("player_id", player.id);
    form.setValue("first_name", player.first_name ?? "");
    form.setValue("last_name", player.last_name ?? "");
    form.setValue("age", player.birth_year);
    form.setValue("club_name", player.club?.name ?? "");
    form.setValue(
      "primary_position",
      player.primary_position ? mapLegacyPosition(player.primary_position) : ""
    );
    setDuplicateDialogOpen(false);
    setDuplicateCandidates([]);
    setSubmitError(null);
    form.clearErrors();
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

  const onSubmit = async (values: WizardFormValues) => {
    if (!user) {
      setSubmitError("Brak zalogowanego użytkownika");
      return;
    }
    setSubmitError(null);

    if (isEditMode && observationId) {
      try {
        const nowIso = new Date().toISOString();
        const positions = [
          codeForLookup(values.primary_position) || values.primary_position,
          ...(values.additional_positions ?? [])
            .filter((p) => p !== values.primary_position)
            .map((p) => codeForLookup(p) || p),
        ].filter(Boolean);
        const sum =
          (values.technical_rating ?? 3) +
          (values.speed_rating ?? 3) +
          (values.motor_rating ?? 3) +
          (values.tactical_rating ?? 3) +
          (values.mental_rating ?? 3) +
          (values.potential_now ?? 3) +
          (values.potential_future ?? 3);
        const overall_rating = Math.round((sum / 7) * 2);
        await updateObservation({
          id: observationId,
          input: {
            source: values.source as ObservationSource,
            rank: values.rank,
            technical_rating: values.technical_rating ?? null,
            speed_rating: values.speed_rating ?? null,
            motor_rating: values.motor_rating ?? null,
            motor_speed_rating: values.motor_speed_rating ?? null,
            motor_endurance_rating: values.motor_endurance_rating ?? null,
            motor_jump_rating: values.motor_jump_rating ?? null,
            motor_agility_rating: values.motor_agility_rating ?? null,
            motor_acceleration_rating: values.motor_acceleration_rating ?? null,
            motor_strength_rating: values.motor_strength_rating ?? null,
            motor_description: values.motor_description?.trim() || null,
            tactical_rating: values.tactical_rating ?? null,
            mental_rating: values.mental_rating ?? null,
            potential_now: values.potential_now,
            potential_future: values.potential_future,
            observation_date: values.match_date,
            competition: values.competition?.trim() || null,
            match_result: values.match_result?.trim() || null,
            location: values.location?.trim() || null,
            positions: positions.length > 0 ? positions : null,
            overall_rating,
            strengths: values.strengths?.trim() || null,
            weaknesses: values.weaknesses?.trim() || null,
            photo_url: values.photo_url?.trim() || null,
            updated_by: user.id,
            updated_at: nowIso,
            updated_by_name: auditName,
            updated_by_role: auditRole,
            form_type: values.form_type ?? "simplified",
            summary: values.summary?.trim() || null,
            recommendation: values.recommendation ?? null,
            match_performance_rating: values.match_performance_rating ?? null,
          },
        });
        if (values.form_type === "extended" && (positionCriteria as EvaluationCriterion[]).length > 0) {
          try {
            await replaceObservationCriterionNotes(
              observationId,
              (positionCriteria as EvaluationCriterion[]).map((c) => ({
                criteria_id: c.id,
                description: criterionNotes[c.id]?.trim() || null,
              }))
            );
          } catch (notesErr) {
            console.error("Criterion notes save failed:", notesErr);
          }
        }
        if (
          prefillPlayer?.id &&
          (pendingFiles.length > 0 || pendingYoutube.length > 0)
        ) {
          try {
            for (const { file } of pendingFiles) {
              await uploadMediaFile({
                file,
                playerId: prefillPlayer.id,
                observationId,
                createdBy: user.id,
              });
            }
            for (const y of pendingYoutube) {
              await addYoutubeLink({
                playerId: prefillPlayer.id,
                observationId,
                youtubeUrl: y.url,
                videoId: y.videoId,
                createdBy: user.id,
                thumbnailUrl: y.thumbnailUrl,
              });
            }
          } catch (mediaErr) {
            console.error("Multimedia upload failed (edit):", mediaErr);
            toast({
              variant: "destructive",
              title: "Zapisano zmiany",
              description: "Nie wszystkie multimedia zostaly dodane. Sprobuj dodac je ponownie.",
            });
          }
        }
        toast({
          title: "Zapisano zmiany",
          description: "Obserwacja zostala zaktualizowana.",
        });
        navigate(cancelHref);
      } catch {
        setSubmitError("Nie udało się zapisać zmian");
        toast({
          variant: "destructive",
          title: "Nie udało się zapisać",
          description: "Sprobuj ponownie za chwile.",
        });
      }
      return;
    }

    const firstName = (values.first_name ?? "").trim();
    const lastName = (values.last_name ?? "").trim();
    const birthYear = values.age ?? DEFAULT_BIRTH_YEAR;
    let playerId = values.player_id ?? prefillPlayer?.id;

    if (!playerId && isOnline && !ignoreDuplicates) {
      try {
        const candidates = await checkDuplicatePlayers({
          first_name: firstName,
          last_name: lastName,
          birth_year: birthYear,
          current_club: values.club_name?.trim() || undefined,
        });
        const high = candidates.filter((c) => c.score >= 80);
        if (high.length > 0) {
          setDuplicateCandidates(high);
          setDuplicateDialogOpen(true);
          setSubmitError("Znaleziono podobnych zawodników. Wybierz istniejącego lub potwierdź nowego.");
          return;
        }
      } catch {
        // continue
      }
    }

    try {
      const nowIso = new Date().toISOString();
      if (!isOnline) {
        const offlinePositions = [
          values.primary_position,
          ...(values.additional_positions ?? []).filter((p) => p !== values.primary_position),
        ];
        const offlineSum =
          (values.technical_rating ?? 3) +
          (values.speed_rating ?? 3) +
          (values.motor_rating ?? 3) +
          (values.tactical_rating ?? 3) +
          (values.mental_rating ?? 3) +
          (values.potential_now ?? 3) +
          (values.potential_future ?? 3);
        const offlineOverall = Math.round((offlineSum / 7) * 2);
        await addOfflineObservation({
          localId: uuidv4(),
          data: {
            player_id: playerId ?? undefined,
            scout_id: user.id,
            first_name: firstName,
            last_name: lastName,
            birth_year: birthYear,
            club_name: values.club_name?.trim(),
            primary_position: values.primary_position,
            should_update_player: Boolean(playerId) && !lockPlayerFields,
            source: values.source as ObservationSource,
            rank: values.rank,
            potential_now: values.potential_now,
            potential_future: values.potential_future,
            observation_date: values.match_date,
            competition: values.competition?.trim(),
            match_result: values.match_result?.trim(),
            location: values.location?.trim(),
            positions: offlinePositions.length > 0 ? offlinePositions : undefined,
            overall_rating: offlineOverall,
            technical_rating: values.technical_rating ?? undefined,
            speed_rating: values.speed_rating ?? undefined,
            motor_rating: values.motor_rating ?? undefined,
            motor_speed_rating: values.motor_speed_rating ?? undefined,
            motor_endurance_rating: values.motor_endurance_rating ?? undefined,
            motor_jump_rating: values.motor_jump_rating ?? undefined,
            motor_agility_rating: values.motor_agility_rating ?? undefined,
            motor_acceleration_rating: values.motor_acceleration_rating ?? undefined,
            motor_strength_rating: values.motor_strength_rating ?? undefined,
            motor_description: values.motor_description?.trim() || undefined,
            tactical_rating: values.tactical_rating ?? undefined,
            mental_rating: values.mental_rating ?? undefined,
            strengths: values.strengths?.trim(),
            weaknesses: values.weaknesses?.trim(),
            photo_url: values.photo_url?.trim(),
            summary: values.summary?.trim(),
            recommendation: values.recommendation ?? undefined,
            form_type: values.form_type ?? "simplified",
            match_performance_rating: values.match_performance_rating ?? undefined,
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

        const positions = [
          codeForLookup(values.primary_position) || values.primary_position,
          ...(values.additional_positions ?? [])
            .filter((p) => p !== values.primary_position)
            .map((p) => codeForLookup(p) || p),
        ].filter(Boolean);
        const sum =
          (values.technical_rating ?? 3) +
          (values.speed_rating ?? 3) +
          (values.motor_rating ?? 3) +
          (values.tactical_rating ?? 3) +
          (values.mental_rating ?? 3) +
          (values.potential_now ?? 3) +
          (values.potential_future ?? 3);
        const overall_rating = Math.round((sum / 7) * 2);
        const observation = await createObservation({
          player_id: playerId,
          scout_id: user.id,
          source: values.source as ObservationSource,
          rank: values.rank,
          technical_rating: values.technical_rating ?? null,
          speed_rating: values.speed_rating ?? null,
          motor_rating: values.motor_rating ?? null,
          motor_speed_rating: values.motor_speed_rating ?? null,
          motor_endurance_rating: values.motor_endurance_rating ?? null,
          motor_jump_rating: values.motor_jump_rating ?? null,
          motor_agility_rating: values.motor_agility_rating ?? null,
          motor_acceleration_rating: values.motor_acceleration_rating ?? null,
          motor_strength_rating: values.motor_strength_rating ?? null,
          motor_description: values.motor_description?.trim() || null,
          tactical_rating: values.tactical_rating ?? null,
          mental_rating: values.mental_rating ?? null,
          potential_now: values.potential_now,
          potential_future: values.potential_future,
          observation_date: values.match_date,
          competition: values.competition?.trim() || null,
          match_result: values.match_result?.trim() || null,
          location: values.location?.trim() || null,
          positions: positions.length > 0 ? positions : null,
          overall_rating,
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
          form_type: values.form_type ?? "simplified",
          summary: values.summary?.trim() || null,
          recommendation: values.recommendation ?? null,
          match_performance_rating: values.match_performance_rating ?? null,
          observation_category: "individual",
        });
        if (values.form_type === "extended" && (positionCriteria as EvaluationCriterion[]).length > 0) {
          try {
            await replaceObservationCriterionNotes(
              observation.id,
              (positionCriteria as EvaluationCriterion[]).map((c) => ({
                criteria_id: c.id,
                description: criterionNotes[c.id]?.trim() || null,
              }))
            );
          } catch (notesErr) {
            console.error("Criterion notes save failed:", notesErr);
          }
        }
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
      setCriterionNotes({});
      localStorage.removeItem("scoutpro-observation-draft");
      goBack();
    } catch {
      setSubmitError("Nie udało się zapisać obserwacji");
      toast({
        variant: "destructive",
        title: "Nie udało się zapisać",
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

  const hasSelectedPlayer =
    Boolean(form.watch("player_id")) ||
    Boolean(lockPlayerFields && prefillPlayer?.id) ||
    isEditMode;
  const showPlayerActions = !lockPlayerFields && !prefillPlayer;

  return (
    <div className="min-h-0 space-y-4">
      <PlayerSearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectPlayer={handleSelectPlayer}
        onAddNew={handleAddNewPlayer}
      />
      <DuplicateWarningDialog
        open={duplicateDialogOpen}
        candidateDisplay={`${form.watch("first_name") ?? ""} ${form.watch("last_name") ?? ""}, ${form.watch("age") ?? DEFAULT_BIRTH_YEAR}, ${form.watch("club_name") ?? "—"}`}
        duplicates={duplicateCandidates}
        onSelectExisting={handleSelectExistingFromDuplicate}
        onConfirmNew={handleConfirmNewDespiteDuplicates}
        onClose={() => setDuplicateDialogOpen(false)}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleInvalid)} className="min-h-0 space-y-6">
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">1. Dane zawodnika</h2>
            {isEditMode && prefillPlayer && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">
                  Zawodnik: {prefillPlayer.first_name} {prefillPlayer.last_name} | Rok urodzenia:{" "}
                  {prefillPlayer.birth_year} | {prefillPlayer.club_name ?? "—"}
                </p>
              </div>
            )}
            {showPlayerActions && !hasSelectedPlayer && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearchDialogOpen(true)}
                >
                  Wybierz z bazy
                </Button>
              </div>
            )}
            {hasSelectedPlayer && showPlayerActions && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">
                  Zawodnik: {form.watch("first_name") ?? ""} {form.watch("last_name") ?? ""} | Rok urodzenia: {form.watch("age") ?? DEFAULT_BIRTH_YEAR} | {form.watch("club_name") ?? "—"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      form.getValues("competition") ||
                      form.getValues("strengths") ||
                      form.getValues("weaknesses")
                    ) {
                      if (window.confirm("Zmiana zawodnika usunie niewysłane dane obserwacji. Kontynuować?")) {
                        form.setValue("player_id", null);
                        form.setValue("first_name", "");
                        form.setValue("last_name", "");
                        form.setValue("age", DEFAULT_BIRTH_YEAR);
                        form.setValue("birth_date", "");
                        form.setValue("club_name", "");
                        form.setValue("primary_position", "");
                        setSearchDialogOpen(true);
                      }
                    } else {
                      form.setValue("player_id", null);
                      form.setValue("first_name", "");
                      form.setValue("last_name", "");
                      form.setValue("age", DEFAULT_BIRTH_YEAR);
                      form.setValue("birth_date", "");
                      form.setValue("club_name", "");
                      form.setValue("primary_position", "");
                      setSearchDialogOpen(true);
                    }
                  }}
                >
                  Zmień zawodnika
                </Button>
              </div>
            )}
            {!isEditMode && (!showPlayerActions || !hasSelectedPlayer) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Imię <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jan"
                        disabled={hasSelectedPlayer}
                        {...field}
                        value={field.value ?? ""}
                      />
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
                    <FormLabel>
                      Nazwisko <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Kowalski"
                        disabled={hasSelectedPlayer}
                        {...field}
                        value={field.value ?? ""}
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
                      Rok urodzenia <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={CURRENT_YEAR - 50}
                        max={CURRENT_YEAR - 8}
                        disabled={hasSelectedPlayer}
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          runDuplicateCheck();
                        }}
                      />
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
                    <FormLabel>Data urodzenia (opcjonalnie)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={hasSelectedPlayer}
                        {...field}
                      />
                    </FormControl>
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
                        disabled={hasSelectedPlayer}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">Typ formularza</h2>
            <FormField
              control={form.control}
              name="form_type"
              render={({ field }) => {
                const isExtended = (field.value ?? "simplified") === "extended";
                return (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">Typ formularza:</span>
                        <div className="relative flex rounded-lg border-2 border-slate-300 bg-slate-100 p-1">
                          <button
                            type="button"
                            onClick={() => field.onChange("simplified")}
                            className={`relative z-10 min-w-[100px] rounded-md px-4 py-2 text-sm font-medium transition ${
                              !isExtended ? "text-white" : "text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            Uproszczony
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("extended")}
                            className={`relative z-10 min-w-[100px] rounded-md px-4 py-2 text-sm font-medium transition ${
                              isExtended ? "text-white" : "text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            Rozszerzony
                          </button>
                          <span
                            className={`absolute top-1 bottom-1 z-0 rounded-md bg-red-600 transition-all duration-200 ${
                              isExtended ? "left-[calc(50%+2px)] right-1" : "left-1 right-[calc(50%+2px)]"
                            }`}
                            aria-hidden
                          />
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">2. Dane obserwacji</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="competition"
                render={({ field }) => {
                  const competitionValue =
                    field.value && String(field.value).trim() !== "" ? field.value : "__none__";
                  return (
                    <FormItem>
                      <FormLabel>Rozgrywki</FormLabel>
                      <Select
                        value={competitionValue}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      >
                        <FormControl>
                          <SelectTrigger ref={field.ref}>
                            <SelectValue placeholder="Wybierz kategorię wiekową" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {(categoriesOptions as { id: string; name: string }[])
                            .filter((c) => c.name != null && String(c.name).trim() !== "")
                            .map((c) => (
                              <SelectItem key={c.id} value={String(c.name)}>
                                {String(c.name)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="match_date"
                render={({ field }) => (
                  <FormItem>
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
              <FormField
                control={form.control}
                name="match_result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wynik meczu</FormLabel>
                    <FormControl>
                      <Input placeholder="2:1 lub 2-1" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokalizacja</FormLabel>
                    <FormControl>
                      <Input placeholder="Stadion Legii Warszawa" {...field} value={field.value ?? ""} />
                    </FormControl>
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
                      Źródło <span className="text-red-600">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder="Wybierz źródło" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(playerSources ?? []).map((s) => (
                          <SelectItem key={s.id} value={String(s.source_code)}>
                            {String(s.name_pl)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">3. Pozycje na boisku</h2>
            <p className="text-xs text-slate-500">Wybierz pozycję główną oraz ewentualnie inne, na których zaobserwowano zawodnika.</p>
            <FormField
              control={form.control}
              name="primary_position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Pozycja główna <span className="text-red-600">*</span>
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <PositionDictionarySelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Wybierz pozycję"
                        className="flex-1"
                      />
                    </FormControl>
                    <PositionPickerDialog
                      value={field.value}
                      onSelect={field.onChange}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additional_positions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dodatkowe pozycje</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {positionOptions.map((option) => {
                      const selected = (field.value ?? []).includes(option.value);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              field.onChange((field.value ?? []).filter((c) => c !== option.value));
                            } else {
                              field.onChange([...(field.value ?? []), option.value]);
                            }
                          }}
                          className={`rounded-full px-3 py-1.5 text-sm transition ${
                            selected
                              ? "bg-slate-800 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {formType === "extended" && !primaryPosition && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">
                Wybierz pozycję główną w sekcji powyżej, aby zobaczyć oceny specyficzne dla pozycji (motoryka i kryteria pozycyjne).
              </p>
            </section>
          )}

          {formType === "simplified" && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-800">4. Oceny ogólne</h2>
              <p className="text-xs text-slate-500">
                Skala 1–5. Ogólna ocena (1–10) jest wyliczana automatycznie.
              </p>
              {(
                [
                  { name: "technical_rating" as const, label: "Technika" },
                  { name: "speed_rating" as const, label: "Szybkość" },
                  { name: "motor_rating" as const, label: "Motoryka" },
                  { name: "tactical_rating" as const, label: "Taktyka" },
                  { name: "mental_rating" as const, label: "Mentalność" },
                ] as const
              ).map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <div className="flex w-full gap-2">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => field.onChange(v)}
                              className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                                (field.value ?? 3) === v
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">
                  Ogólna ocena:{" "}
                  {Math.round(
                    ((form.watch("technical_rating") ?? 3) +
                      (form.watch("speed_rating") ?? 3) +
                      (form.watch("motor_rating") ?? 3) +
                      (form.watch("tactical_rating") ?? 3) +
                      (form.watch("mental_rating") ?? 3) +
                      (form.watch("potential_now") ?? 3) +
                      (form.watch("potential_future") ?? 3)) /
                      7 *
                      2
                  )}
                  /10
                </p>
                <p className="text-xs text-slate-500">(wyliczana z powyższych ocen)</p>
              </div>
            </section>
          )}

          {formType === "extended" && primaryPosition && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-800">
                4b. Oceny specyficzne dla pozycji — Kryteria pozycyjne — {getPositionLabelFromDictionary(positions, primaryPosition)}
              </h2>
              <p className="text-xs text-slate-500">
                Oceny 1–5 dla zdolności motorycznych oraz opcjonalne notatki do kryteriów dla pozycji głównej zawodnika.
              </p>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  ZDOLNOŚCI MOTORYCZNE (skala 1–5)
                </h3>
                {(
                  [
                    { name: "motor_speed_rating" as const, label: "Szybkość" },
                    { name: "motor_endurance_rating" as const, label: "Wytrzymałość" },
                    { name: "motor_jump_rating" as const, label: "Skoczność" },
                    { name: "motor_agility_rating" as const, label: "Zwrotność" },
                    { name: "motor_acceleration_rating" as const, label: "Szybkość startowa" },
                    { name: "motor_strength_rating" as const, label: "Siła" },
                  ] as const
                ).map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <div className="flex w-full gap-2">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => field.onChange(v)}
                                className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                                  (field.value ?? 3) === v
                                    ? "border-slate-700 bg-slate-700 text-white"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="motor_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis motoryki</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Opis zdolności motorycznych zawodnika (max 2000 znaków)."
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          className="min-h-[72px]"
                          maxLength={2000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {formType === "extended" && codeForLookup(primaryPosition) !== "GK" && (
                <>
                  <h3 className="text-sm font-semibold text-slate-700 pt-4">Notatki do kryteriów (formularz rozszerzony)</h3>
                  {(
                    [
                      { key: "defense" as const, label: "DEFENSYWA — BRONIENIE" },
                      { key: "offense" as const, label: "OFENSYWA — POSIADANIE PIŁKI" },
                      { key: "transition_oa" as const, label: "FAZA PRZEJŚCIOWA O→A" },
                      { key: "transition_ao" as const, label: "FAZA PRZEJŚCIOWA A→O" },
                      { key: null, label: "Inne" },
                    ] as const
                  ).map(({ key, label }) => {
                    const criteriaInSection = (positionCriteria as EvaluationCriterion[]).filter(
                      (c) => (c.section ?? null) === key
                    );
                    if (criteriaInSection.length === 0) return null;
                    const isTransition = key === "transition_oa" || key === "transition_ao";
                    return (
                      <div key={label} className="space-y-2 pt-2">
                        <h4 className={`text-sm font-semibold ${isTransition ? "text-red-600 uppercase" : "text-slate-700"}`}>
                          {label}
                        </h4>
                        <div className="space-y-2">
                          {criteriaInSection.map((c) => (
                            <div key={c.id} className="space-y-1">
                              <label className="text-sm text-slate-600">{c.name}</label>
                              <Textarea
                                placeholder="Opcjonalna notatka (max 2000 znaków)"
                                value={criterionNotes[c.id] ?? ""}
                                onChange={(e) =>
                                  setCriterionNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                                }
                                className="min-h-[72px]"
                                maxLength={2000}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </section>
          )}

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">5. Analiza i notatki</h2>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem className="mb-0">
                    <FormControl>
                      <StrengthsWeaknessesTagField
                        label="Mocne strony"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        dictionaryOptions={(strengthsOptions as { id: string; name_pl: string }[]).map(
                          (r) => ({ id: r.id, name_pl: String(r.name_pl) })
                        )}
                        variant="strengths"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weaknesses"
                render={({ field }) => (
                  <FormItem className="mb-0">
                    <FormControl>
                      <StrengthsWeaknessesTagField
                        label="Słabe strony"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        dictionaryOptions={(weaknessesOptions as { id: string; name_pl: string }[]).map(
                          (r) => ({ id: r.id, name_pl: String(r.name_pl) })
                        )}
                        variant="weaknesses"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="rank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Ranga <span className="text-red-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex w-full gap-2">
                      {[
                        { value: "A", label: "A - TOP" },
                        { value: "B", label: "B - Dobry" },
                        { value: "C", label: "C - Szeroka kadra" },
                        { value: "D", label: "D - Slaby" },
                      ].map((opt) => {
                        const selected = field.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`min-h-12 flex-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition touch-manipulation ${
                              selected
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podsumowanie (min. 10 znaków)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jedno pole: analiza występu, mocne i słabe strony, rekomendacje (min. 10, max 5000 znaków)."
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="min-h-[100px]"
                      maxLength={5000}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rekomendacja</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "positive" as const, label: "Pozytywna" },
                        { value: "to_observe" as const, label: "Do obserwacji" },
                        { value: "negative" as const, label: "Negatywna" },
                      ].map((opt) => {
                        const selected = field.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition touch-manipulation ${
                              selected
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="potential_now"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potencjał obecny</FormLabel>
                  <FormControl>
                    <div className="flex w-full gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => field.onChange(v)}
                          className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                            (field.value ?? 3) === v
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
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
                  <FormLabel>Potencjał przyszły</FormLabel>
                  <FormControl>
                    <div className="flex w-full gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => field.onChange(v)}
                          className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                            (field.value ?? 3) === v
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">6. Multimedia</h2>
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
              savedMedia={savedMedia}
              onRemovePending={(id) => setPendingFiles((prev) => prev.filter((p) => p.id !== id))}
              onRemoveYoutube={(index) =>
                setPendingYoutube((prev) => prev.filter((_, i) => i !== index))
              }
              onRemoveSaved={onRemoveSavedMedia}
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

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!isEditMode && (
                <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                  Zapisz szkic
                </Button>
              )}
              <Button asChild type="button" variant="outline">
                <Link to={cancelHref}>Anuluj</Link>
              </Button>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Zapisz obserwację"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
