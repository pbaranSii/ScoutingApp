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
  fetchCriteriaForObservationForm,
  type EvaluationCriterion,
  type ObservationFormElement,
} from "../api/evaluationCriteria.api";
import {
  fetchObservationCriterionNotes,
  replaceObservationCriterionNotes,
} from "../api/observationCriterionNotes.api";
import { useQuery } from "@tanstack/react-query";
import { useCreatePlayer, useUpdatePlayer } from "@/features/players/hooks/usePlayers";
import { fetchPlayerById } from "@/features/players/api/players.api";
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
import { useStrengths, useWeaknesses, useCategories, usePlayerSources } from "@/features/dictionaries/hooks/useDictionaries";
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

/** Wartości enum observation_source – do filtrowania opcji ze słownika i fallbacku. */
const OBSERVATION_SOURCE_VALID = new Set([
  "scouting", "referral", "application", "trainer_report", "scout_report",
  "video_analysis", "tournament", "training_camp", "live_match", "video_match", "video_clips",
]);
const FALLBACK_SOURCE_OPTIONS = [
  { value: "live_match", label: "Mecz na żywo" },
  { value: "video_match", label: "Mecz wideo" },
  { value: "video_clips", label: "Fragmenty wideo" },
] as const;

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
    league: z.string().max(200).optional(),
    home_team: z.string().max(200).optional(),
    away_team: z.string().max(200).optional(),
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
    notes: z.string().max(2000).optional(),
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
    motor_speed_rating: z.preprocess(
      (v) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? 3 : Number(v)),
      z.number().int().min(1).max(5)
    ),
    motor_endurance_rating: z.preprocess(
      (v) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? 3 : Number(v)),
      z.number().int().min(1).max(5)
    ),
    motor_jump_rating: z.preprocess(
      (v) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? 3 : Number(v)),
      z.number().int().min(1).max(5)
    ),
    motor_agility_rating: z.preprocess(
      (v) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? 3 : Number(v)),
      z.number().int().min(1).max(5)
    ),
    motor_acceleration_rating: z.preprocess(
      (v) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? 3 : Number(v)),
      z.number().int().min(1).max(5)
    ),
    motor_strength_rating: z.preprocess(
      (v) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? 3 : Number(v)),
      z.number().int().min(1).max(5)
    ),
    photo_url: z.string().optional(),
    rank: z.string().optional(),
    source: z.string().min(1, "Wybierz zrodlo"),
    form_type: z.enum(["simplified", "extended", "academy", "senior"]).optional(),
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
    transfermarkt_url: z.string().max(500).optional(),
    instagram_url: z.string().max(500).optional(),
    facebook_url: z.string().max(500).optional(),
    other_social_url: z.string().max(500).optional(),
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
    const ft = data.form_type === "simplified" || data.form_type === "extended" ? "academy" : data.form_type;
    if (ft === "senior" && !(String(data.rank ?? "").trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wybierz range",
        path: ["rank"],
      });
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
  /** Domyślny typ formularza w trybie tworzenia (akademia = pełny formularz, senior = uproszczony). */
  defaultFormType?: "academy" | "senior";
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
  const individualSourceOptions = useMemo(() => {
    const fromDict = (playerSources as { source_code?: string; name_pl?: string }[])
      .filter((e) => OBSERVATION_SOURCE_VALID.has(String(e.source_code ?? "")))
      .map((e) => ({ value: String(e.source_code), label: String(e.name_pl ?? e.source_code ?? "") }));
    const seen = new Set(fromDict.map((o) => o.value));
    const fallbacks = FALLBACK_SOURCE_OPTIONS.filter((f) => !seen.has(f.value));
    return [...fromDict, ...fallbacks];
  }, [playerSources]);
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
      league: "",
      home_team: "",
      away_team: "",
      match_date: format(new Date(), "yyyy-MM-dd"),
      match_result: "",
      location: "",
      notes: "",
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
      source: "live_match",
      photo_url: "",
      form_type: defaultFormType ?? "academy",
      summary: "",
      recommendation: undefined,
      match_performance_rating: undefined,
      birth_date: "",
      motor_description: "",
      transfermarkt_url: "",
      instagram_url: "",
      facebook_url: "",
      other_social_url: "",
    },
  });

  const primaryPosition = form.watch("primary_position");
  const isMatchPlayer = form.watch("observation_category") === "match_player";
  const rawFormType = form.watch("form_type") ?? "academy";
  const formType = rawFormType === "simplified" || rawFormType === "extended" ? "academy" : rawFormType;
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
    queryKey: ["evaluation-criteria-form", primaryPosition],
    queryFn: () => fetchCriteriaForObservationForm(primaryPosition || ""),
    enabled: Boolean(primaryPosition?.trim()),
  });

  const criteriaFromForm = (elements: ObservationFormElement[]): EvaluationCriterion[] =>
    elements.filter((e): e is { type: "criterion"; criterion: EvaluationCriterion } => e.type === "criterion").map((e) => e.criterion);

  const isEditMode = mode === "edit" && Boolean(observationId);
  const selectedPlayerId = form.watch("player_id");
  const { data: selectedPlayerFull } = useQuery({
    queryKey: ["player-for-links", selectedPlayerId],
    queryFn: () => fetchPlayerById(selectedPlayerId!),
    enabled: Boolean(selectedPlayerId) && formType === "academy",
  });
  const { data: existingCriterionNotes } = useQuery({
    queryKey: ["observation-criterion-notes", observationId],
    queryFn: () => fetchObservationCriterionNotes(observationId!),
    enabled: isEditMode && formType === "academy",
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

  useEffect(() => {
    if (!selectedPlayerFull || formType !== "academy") return;
    const t = (selectedPlayerFull as { transfermarkt_url?: string | null }).transfermarkt_url?.trim() ?? "";
    const i = (selectedPlayerFull as { instagram_url?: string | null }).instagram_url?.trim() ?? "";
    const f = (selectedPlayerFull as { facebook_url?: string | null }).facebook_url?.trim() ?? "";
    const o = (selectedPlayerFull as { other_social_url?: string | null }).other_social_url?.trim() ?? "";
    const cur = form.getValues();
    if (!(cur.transfermarkt_url ?? "").trim() && t) form.setValue("transfermarkt_url", t);
    if (!(cur.instagram_url ?? "").trim() && i) form.setValue("instagram_url", i);
    if (!(cur.facebook_url ?? "").trim() && f) form.setValue("facebook_url", f);
    if (!(cur.other_social_url ?? "").trim() && o) form.setValue("other_social_url", o);
  }, [selectedPlayerFull, formType, form]);

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

    const criteria = criteriaFromForm(positionCriteria as ObservationFormElement[]);
    if (values.form_type === "senior" && criteria.length > 0) {
      const required = criteria.filter((c) => c.is_required);
      const missing = required.filter((c) => !(criterionNotes[c.id]?.trim()));
      if (missing.length > 0) {
        setSubmitError(
          `Uzupełnij wymagane kryteria pozycyjne: ${missing.map((c) => c.name).join(", ")}`
        );
        return;
      }
    }

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
        const computedOverall = Math.round((sum / 7) * 2);
        const overall_rating = values.overall_rating ?? computedOverall;
        await updateObservation({
          id: observationId,
          input: {
            source: values.source as ObservationSource,
            rank: (values.form_type === "simplified" || values.form_type === "extended" ? "academy" : values.form_type) === "senior" ? values.rank : (values.rank?.trim() || "B"),
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
            league: values.league?.trim() || null,
            home_team: values.home_team?.trim() || null,
            away_team: values.away_team?.trim() || null,
            match_result: values.match_result?.trim() || null,
            location: values.location?.trim() || null,
            notes: values.notes?.trim() || null,
            positions: positions.length > 0 ? positions : null,
            overall_rating,
            strengths: values.strengths?.trim() || null,
            weaknesses: values.weaknesses?.trim() || null,
            photo_url: values.photo_url?.trim() || null,
            updated_by: user.id,
            updated_at: nowIso,
            updated_by_name: auditName,
            updated_by_role: auditRole,
            form_type: (values.form_type === "simplified" || values.form_type === "extended" ? "academy" : values.form_type) ?? "academy",
            summary: values.summary?.trim() || null,
            recommendation: values.recommendation ?? null,
            match_performance_rating: values.match_performance_rating ?? null,
          },
        });
        if (values.form_type === "senior" && criteria.length > 0) {
          try {
            await replaceObservationCriterionNotes(
              observationId,
              criteria.map((c) => ({
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
            rank: (values.form_type === "simplified" || values.form_type === "extended" ? "academy" : values.form_type) === "senior" ? values.rank : (values.rank?.trim() || "B"),
            potential_now: values.potential_now,
            potential_future: values.potential_future,
            observation_date: values.match_date,
            competition: values.competition?.trim(),
            league: values.league?.trim() || undefined,
            home_team: values.home_team?.trim() || undefined,
            away_team: values.away_team?.trim() || undefined,
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
            form_type: (values.form_type === "simplified" || values.form_type === "extended" ? "academy" : values.form_type) ?? "academy",
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
        if (playerId) {
          const clubId = await resolveClubId(values.club_name?.trim());
          await updatePlayer({
            id: playerId,
            input: {
              first_name: firstName,
              last_name: lastName,
              birth_year: birthYear,
              club_id: clubId ?? null,
              primary_position: values.primary_position,
              transfermarkt_url: values.transfermarkt_url?.trim() || null,
              instagram_url: values.instagram_url?.trim() || null,
              facebook_url: values.facebook_url?.trim() || null,
              other_social_url: values.other_social_url?.trim() || null,
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
            transfermarkt_url: values.transfermarkt_url?.trim() || null,
            instagram_url: values.instagram_url?.trim() || null,
            facebook_url: values.facebook_url?.trim() || null,
            other_social_url: values.other_social_url?.trim() || null,
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
          rank: (values.form_type === "simplified" || values.form_type === "extended" ? "academy" : values.form_type) === "senior" ? values.rank : (values.rank?.trim() || "B"),
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
          league: values.league?.trim() || null,
          home_team: values.home_team?.trim() || null,
          away_team: values.away_team?.trim() || null,
          match_result: values.match_result?.trim() || null,
          location: values.location?.trim() || null,
          notes: values.notes?.trim() || null,
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
          form_type: (values.form_type === "simplified" || values.form_type === "extended" ? "academy" : values.form_type) ?? "academy",
          summary: values.summary?.trim() || null,
          recommendation: values.recommendation ?? null,
          match_performance_rating: values.match_performance_rating ?? null,
          observation_category: "individual",
        });
        if (values.form_type === "senior" && criteria.length > 0) {
          try {
            await replaceObservationCriterionNotes(
              observation.id,
              criteria.map((c) => ({
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
                  Istniejący zawodnik z bazy — dane poniżej można edytować i zostaną zapisane w profilu przy zapisie obserwacji.
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
            {!isEditMode && (
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
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            )}
          </section>

          {(formType === "academy" || formType === "senior") && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-800">Portale społecznościowe</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="transfermarkt_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TransferMarkt URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.transfermarkt.pl/..." {...field} value={field.value ?? ""} />
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
                      <FormLabel>Facebook URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.facebook.com/..." {...field} value={field.value ?? ""} />
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
                      <FormLabel>Instagram URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.instagram.com/..." {...field} value={field.value ?? ""} />
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
                      <FormLabel>Inne URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          )}

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">2. Dane obserwacji</h2>
            {isMatchPlayer && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Dane meczu (liga, lokalizacja, drużyny, wynik, notatki do meczu) są wspólne dla wszystkich zawodników w tej
                obserwacji meczowej. Edytuj je w <strong>nagłówku meczu</strong>.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
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
                        {individualSourceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
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
                name="league"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liga</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="np. Ekstraklasa, 1. Liga"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isMatchPlayer}
                      />
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
                      <Input
                        placeholder="Stadion Legii Warszawa"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isMatchPlayer}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.watch("source") !== "tournament" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="home_team"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gospodarz</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nazwa drużyny gospodarzy"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isMatchPlayer}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="away_team"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gość</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nazwa drużyny gości"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isMatchPlayer}
                        />
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
                        <Input
                          placeholder="2:1 lub 2-1"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isMatchPlayer}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isMatchPlayer
                      ? "Notatki do meczu (wspólne – edytuj w nagłówku meczu)"
                      : "Notatki do meczu (opcjonalnie, max 2000 znaków)"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notatki do meczu..."
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[80px]"
                      maxLength={2000}
                      disabled={isMatchPlayer}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">Typ formularza</h2>
            <FormField
              control={form.control}
              name="form_type"
              render={({ field }) => {
                const raw = field.value ?? "academy";
                const isSenior = raw === "senior";
                const displayAcademy = raw === "academy" || raw === "simplified" || raw === "extended";
                return (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">Typ formularza:</span>
                        <div className="relative flex rounded-lg border-2 border-slate-300 bg-slate-100 p-1">
                          <button
                            type="button"
                            onClick={() => field.onChange("academy")}
                            className={`relative z-10 min-w-[100px] rounded-md px-4 py-2 text-sm font-medium transition ${
                              displayAcademy ? "text-white" : "text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            Akademia
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("senior")}
                            className={`relative z-10 min-w-[100px] rounded-md px-4 py-2 text-sm font-medium transition ${
                              isSenior ? "text-white" : "text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            Senior
                          </button>
                          <span
                            className={`absolute top-1 bottom-1 z-0 rounded-md bg-red-600 transition-all duration-200 ${
                              isSenior ? "left-[calc(50%+2px)] right-1" : "left-1 right-[calc(50%+2px)]"
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

          {formType === "senior" && !primaryPosition && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">
                Wybierz pozycję główną w sekcji powyżej, aby zobaczyć oceny specyficzne dla pozycji (motoryka i kryteria pozycyjne).
              </p>
            </section>
          )}

          {formType === "academy" && (
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
              {isEditMode && (
                <>
                  <FormField
                    control={form.control}
                    name="overall_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ocena ogólna (1–10)</FormLabel>
                        <FormControl>
                          <div className="flex w-full flex-wrap gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => field.onChange(v)}
                                className={`min-h-10 w-12 rounded-lg border-2 text-sm font-medium transition touch-manipulation ${
                                  (field.value ?? 0) === v
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
                    name="match_performance_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ocena za występ (1–5)</FormLabel>
                        <FormControl>
                          <div className="flex w-full gap-2">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => field.onChange(v)}
                                className={`min-h-10 flex-1 rounded-lg border-2 text-sm font-medium transition touch-manipulation ${
                                  (field.value ?? 0) === v
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
                </>
              )}
            </section>
          )}

          {formType === "senior" && primaryPosition && (
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

              {formType === "senior" && codeForLookup(primaryPosition) !== "GK" && (
                <>
                  <h3 className="text-sm font-semibold text-slate-700 pt-4">Notatki do kryteriów (formularz rozszerzony)</h3>
                  {(positionCriteria as ObservationFormElement[]).map((el, idx) =>
                    el.type === "header" ? (
                      el.label ? (
                        <h4 key={`h-${idx}`} className="text-sm font-semibold text-slate-700 pt-2">
                          {el.label}
                        </h4>
                      ) : null
                    ) : (
                      <div key={el.criterion.id} className="space-y-1 pt-2">
                        <label className={`text-sm ${el.criterion.is_required ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                          {el.criterion.name}
                          {el.criterion.is_required && <span className="ml-0.5 text-red-600">*</span>}
                        </label>
                        <Textarea
                          placeholder={el.criterion.is_required ? "Wymagane (min. 1 znak)" : "Opcjonalna notatka (max 2000 znaków)"}
                          value={criterionNotes[el.criterion.id] ?? ""}
                          onChange={(e) =>
                            setCriterionNotes((prev) => ({ ...prev, [el.criterion.id]: e.target.value }))
                          }
                          className={`min-h-[72px] ${el.criterion.is_required && !(criterionNotes[el.criterion.id]?.trim()) ? "border-red-500" : ""}`}
                          maxLength={2000}
                        />
                      </div>
                    )
                  )}
                </>
              )}
            </section>
          )}

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">5. Analiza i notatki</h2>
            {formType === "senior" && (
              <FormField
                control={form.control}
                name="match_performance_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ocena za występ (1–5) <span className="text-red-600">*</span></FormLabel>
                    <FormControl>
                      <div className="flex w-full gap-2">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => field.onChange(v)}
                            className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                              (field.value ?? 0) === v
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
            )}
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
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podsumowanie (min. 10 znaków)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={formType === "academy" ? "Analiza występu, mocne i słabe strony, rekomendacja, porównanie do naszego zawodnika" : "Opis występu, mocne i słabe strony, rekomendacja, porównanie do zawodnika KS Polonia"}
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
            {formType === "academy" && (
              <>
                <FormField
                  control={form.control}
                  name="potential_now"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance</FormLabel>
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
              </>
            )}
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
            {formType === "senior" && (
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
            )}
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
