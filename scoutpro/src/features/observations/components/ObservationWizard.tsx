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
import { replaceObservationMatches, type ObservationMatchInput } from "../api/observationMatches.api";
import { updateMatchObservation } from "../api/matchObservations.api";
import { useQuery } from "@tanstack/react-query";
import { useCreatePlayer, useUpdatePlayer } from "@/features/players/hooks/usePlayers";
import { fetchPlayerById, fetchClubByName } from "@/features/players/api/players.api";
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
import { useFormations } from "@/features/tactical/hooks/useFormations";
import { mapLegacyPosition } from "@/features/players/positions";
import { checkDuplicatePlayers } from "@/features/players/api/players.api";
import type { DuplicateCandidate } from "@/features/players/api/players.api";
import type { PlayerSearchItem } from "@/features/players/api/players.api";
import {
  useStrengths,
  useWeaknesses,
  useCategoriesForCurrentArea,
  usePlayerSources,
  useBodyBuild,
  useLeaguesForCurrentArea,
} from "@/features/dictionaries/hooks/useDictionaries";
import { StrengthsWeaknessesTagField } from "./StrengthsWeaknessesTagField";
import { PlayerSearchDialog } from "./PlayerSearchDialog";
import { DuplicateWarningDialog } from "./DuplicateWarningDialog";
import { toast } from "@/hooks/use-toast";
import { MediaPreview, MediaUploadModal } from "@/features/multimedia";
import type { Multimedia } from "@/features/multimedia/types";
import { uploadMediaFile, addYoutubeLink } from "@/features/multimedia/api/multimedia.api";
import { MAX_MEDIA_PER_OBSERVATION } from "@/features/multimedia/types";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";

const CURRENT_YEAR = new Date().getFullYear();
/** Domyślny rok urodzenia dla nowego zawodnika w formularzu obserwacji */
const DEFAULT_BIRTH_YEAR = 2010;

/** Wartości enum observation_source – do filtrowania opcji ze słownika i fallbacku. */
const OBSERVATION_SOURCE_VALID = new Set([
  "scouting", "referral", "application", "trainer_report", "scout_report",
  "video_analysis", "tournament", "training_camp", "live_match", "video_match", "video_clips",
]);
const MATCH_SOURCE_ALLOWED = new Set(["live_match", "video_match", "video_clips", "tournament"]);
const HALF_STEP_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

const wizardSchema = z
  .object({
    player_id: z.string().uuid().optional().nullable(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    nationality: z.string().max(120).optional(),
    body_build: z.string().max(100).optional(),
    agent_name: z.string().max(200).optional(),
    agent_phone: z.string().max(100).optional(),
    agent_email: z.string().email("Podaj poprawny email").optional().or(z.literal("")),
    club_formation: z.string().max(100).optional(),
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
    home_team_formation: z.string().optional(),
    away_team_formation: z.string().optional(),
    notes: z.string().max(2000).optional(),
    observation_category: z.enum(["match_player", "individual"]).optional(),
    primary_position: z.string().min(1, "Wybierz pozycje"),
    additional_positions: z.array(z.string()).optional(),
    technical_rating: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().int().min(1).max(5).optional()
    ),
    speed_rating: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().int().min(1).max(5).optional()
    ),
    motor_rating: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().int().min(1).max(5).optional()
    ),
    tactical_rating: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().int().min(1).max(5).optional()
    ),
    mental_rating: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().int().min(1).max(5).optional()
    ),
    potential_now: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().min(1).max(5).optional()
    ),
    potential_future: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().min(1).max(5).optional()
    ),
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
    match_performance_rating: z.preprocess(
      (v) => (v === undefined || v === "" || v === null ? undefined : Number(v)),
      z.number().min(1).max(5).optional()
    ),
    motor_description: z.string().max(2000).optional(),
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

    // Wymagalność (zgodnie z wymaganiami biznesowymi)
    const rawFormType = data.form_type ?? "academy";
    const uiFormType =
      rawFormType === "senior" || rawFormType === "extended" ? "senior" : "academy";

    if (!data.recommendation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wybierz rekomendację",
        path: ["recommendation"],
      });
    }

    if (data.potential_now == null || Number.isNaN(Number(data.potential_now))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Uzupełnij Performance",
        path: ["potential_now"],
      });
    }
    if (data.potential_future == null || Number.isNaN(Number(data.potential_future))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Uzupełnij Potencjał przyszły",
        path: ["potential_future"],
      });
    }

    if (uiFormType === "academy" && data.observation_category !== "match_player") {
      const req: Array<keyof WizardFormValues> = [
        "technical_rating",
        "speed_rating",
        "motor_rating",
        "tactical_rating",
        "mental_rating",
      ];
      for (const key of req) {
        const v = (data as any)[key];
        if (v == null || Number.isNaN(Number(v))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Wybierz ocenę (1–5)",
            path: [key],
          });
        }
      }
    }

    if (data.observation_category === "match_player") {
      if (data.match_performance_rating == null || Number.isNaN(Number(data.match_performance_rating))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wybierz ocenę za występ (1–5)",
          path: ["match_performance_rating"],
        });
      }
    }
  });

function toDbFormType(
  v: WizardFormValues["form_type"]
): "simplified" | "extended" | null {
  const raw = (v ?? "").toString();
  if (!raw) return null;
  if (raw === "senior" || raw === "extended") return "extended";
  if (raw === "academy" || raw === "simplified") return "simplified";
  return null;
}

type WizardFormValues = z.infer<typeof wizardSchema>;
type MatchRow = {
  id: string;
  match_date: string;
  competition?: string;
  league?: string;
  home_team?: string;
  away_team?: string;
  match_result?: string;
  source?: string;
  home_team_formation?: string;
  away_team_formation?: string;
  notes?: string;
  isSaved?: boolean;
};

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
  /** Id nagłówka meczu (dla obserwacji meczowej w trybie edycji) – do zapisu formacji. */
  matchObservationId?: string;
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
  matchObservationId,
  initialValues,
  prefillPlayer,
  lockPlayerFields = false,
  cancelHref = "/observations",
  defaultFormType,
  savedMedia = [],
  onRemoveSavedMedia,
}: ObservationWizardProps) {
  const { user } = useAuthStore();
  const { data: currentUserProfile } = useCurrentUserProfile();
  const userAreaAccess =
    (currentUserProfile as { area_access?: "AKADEMIA" | "SENIOR" | "ALL" } | null)?.area_access ??
    "AKADEMIA";
  const showCompetitionField = userAreaAccess !== "SENIOR";
  const isOnline = useOnlineStatus();
  const { data: playerSources = [] } = usePlayerSources();
  const { data: bodyBuildOptions = [] } = useBodyBuild();
  const individualSourceOptions = useMemo(() => {
    const fromDict = (playerSources as { source_code?: string; name_pl?: string; is_default?: boolean }[])
      .filter((e) => OBSERVATION_SOURCE_VALID.has(String(e.source_code ?? "")))
      .map((e) => ({
        value: String(e.source_code),
        label: String(e.name_pl ?? e.source_code ?? ""),
        isDefault: Boolean(e.is_default),
      }));
    return fromDict;
  }, [playerSources]);
  const matchSourceOptions = useMemo(() => {
    const fallback = [
      { value: "live_match", label: "Mecz na żywo" },
      { value: "video_match", label: "Mecz wideo" },
      { value: "video_clips", label: "Fragmenty wideo" },
      { value: "tournament", label: "Turniej" },
    ] as const;

    const fromDict = (playerSources as { source_code?: string; name_pl?: string }[])
      .filter((e) => MATCH_SOURCE_ALLOWED.has(String(e.source_code ?? "")))
      .map((e) => ({
        value: String(e.source_code ?? ""),
        label: String(e.name_pl ?? e.source_code ?? ""),
      }))
      .filter((o) => o.value.trim() !== "" && o.label.trim() !== "");

    if (fromDict.length === MATCH_SOURCE_ALLOWED.size) return fromDict;

    const byValue = new Map(fromDict.map((o) => [o.value, o]));
    return fallback.map((f) => byValue.get(f.value) ?? f);
  }, [playerSources]);
  const defaultSourceValue = useMemo(
    () => individualSourceOptions.find((o) => o.isDefault)?.value ?? "live_match",
    [individualSourceOptions]
  );
  const { data: categoriesOptions = [] } = useCategoriesForCurrentArea();
  const { data: leagueOptions = [] } = useLeaguesForCurrentArea();
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

  const resolveAgeCategoryId = useCallback(
    (birthYear: number): string | null => {
      const y = Number(birthYear);
      if (!Number.isFinite(y)) return null;

      const cats = (categoriesOptions ?? []) as Array<Record<string, unknown>>;
      if (cats.length === 0) return null;

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
        if (aMin != null && bMin != null && aMin !== bMin) return Number(aMin) - Number(bMin);

        return 0;
      });

      const best = (candidates[0]?.c ?? null) as { id?: unknown } | null;
      const bestId = best?.id != null ? String(best.id) : "";
      if (bestId.trim() !== "") return bestId;

      const fallbackId = cats[0]?.id != null ? String(cats[0]?.id) : "";
      return fallbackId.trim() !== "" ? fallbackId : null;
    },
    [categoriesOptions]
  );
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
      nationality: "Polska",
      body_build: "",
      agent_name: "",
      agent_phone: "",
      agent_email: "",
      club_formation: "",
      age: DEFAULT_BIRTH_YEAR,
      club_name: "",
      competition: "",
      league: "",
      home_team: "",
      away_team: "",
      match_date: format(new Date(), "yyyy-MM-dd"),
      match_result: "",
      notes: "",
      observation_category: "individual",
      primary_position: "",
      additional_positions: [],
      technical_rating: undefined,
      speed_rating: undefined,
      motor_rating: undefined,
      tactical_rating: undefined,
      mental_rating: undefined,
      potential_now: undefined,
      potential_future: undefined,
      motor_speed_rating: 3,
      motor_endurance_rating: 3,
      motor_jump_rating: 3,
      motor_agility_rating: 3,
      motor_acceleration_rating: 3,
      motor_strength_rating: 3,
      overall_rating: undefined,
      strengths: "",
      weaknesses: "",
      source: defaultSourceValue,
      photo_url: "",
      form_type: defaultFormType ?? "academy",
      summary: "",
      recommendation: undefined,
      match_performance_rating: undefined,
      home_team_formation: "",
      away_team_formation: "",
      birth_date: "",
      contract_end_date: "",
      motor_description: "",
      transfermarkt_url: "",
      instagram_url: "",
      facebook_url: "",
      other_social_url: "",
    },
  });

  const primaryPosition = form.watch("primary_position");
  const isMatchPlayer = form.watch("observation_category") === "match_player";
  const [matchRows, setMatchRows] = useState<MatchRow[]>([]);
  const rawFormType = form.watch("form_type") ?? "academy";
  const formType = (String(rawFormType) === "simplified" || String(rawFormType) === "extended") ? "academy" : (rawFormType as "academy" | "senior");
  const { data: positions = [] } = usePositionDictionary(true);
  const { data: formations = [] } = useFormations();
  const formationOptionValue = useCallback((f: { id: string; code?: string | null }) => {
    const code = String(f.code ?? "").trim();
    return code || f.id;
  }, []);
  const normalizeFormationForSelect = useCallback(
    (value?: string) => {
      const current = String(value ?? "").trim();
      if (!current) return "";
      const byId = (formations as { id: string; code?: string | null }[]).find((f) => f.id === current);
      if (byId) return formationOptionValue(byId);
      return current;
    },
    [formations, formationOptionValue]
  );
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
    enabled: Boolean(selectedPlayerId),
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
    const fromInitial = (initialValues as { matches?: MatchRow[] } | undefined)?.matches;
    if (Array.isArray(fromInitial) && fromInitial.length > 0) {
      setMatchRows(
        fromInitial.map((m) => ({
          id: uuidv4(),
          match_date: m.match_date || format(new Date(), "yyyy-MM-dd"),
          competition: m.competition ?? "",
          league: m.league ?? "",
          home_team: m.home_team ?? "",
          away_team: m.away_team ?? "",
          match_result: m.match_result ?? "",
          source: m.source ?? defaultSourceValue,
          home_team_formation: m.home_team_formation ?? "",
          away_team_formation: m.away_team_formation ?? "",
          notes: m.notes ?? "",
          isSaved: true,
        }))
      );
      return;
    }
    setMatchRows((prev) => prev);
  }, [initialValues, defaultSourceValue]);
  useEffect(() => {
    const currentSource = form.getValues("source");
    if (!currentSource || !individualSourceOptions.some((o) => o.value === currentSource)) {
      form.setValue("source", defaultSourceValue);
    }
  }, [defaultSourceValue, individualSourceOptions, form]);

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
    if (!selectedPlayerFull) return;
    const t = (selectedPlayerFull as { transfermarkt_url?: string | null }).transfermarkt_url?.trim() ?? "";
    const i = (selectedPlayerFull as { instagram_url?: string | null }).instagram_url?.trim() ?? "";
    const f = (selectedPlayerFull as { facebook_url?: string | null }).facebook_url?.trim() ?? "";
    const o = (selectedPlayerFull as { other_social_url?: string | null }).other_social_url?.trim() ?? "";
    const ce = (selectedPlayerFull as { contract_end_date?: string | null }).contract_end_date?.trim() ?? "";
    const nat = (selectedPlayerFull as { nationality?: string | null }).nationality?.trim() ?? "";
    const an = (selectedPlayerFull as { agent_name?: string | null }).agent_name?.trim() ?? "";
    const ap = (selectedPlayerFull as { agent_phone?: string | null }).agent_phone?.trim() ?? "";
    const ae = (selectedPlayerFull as { agent_email?: string | null }).agent_email?.trim() ?? "";
    const cf = (selectedPlayerFull as { club_formation?: string | null }).club_formation?.trim() ?? "";
    const bb = (selectedPlayerFull as { body_build?: string | null }).body_build?.trim() ?? "";
    const cur = form.getValues();
    if (!(cur.transfermarkt_url ?? "").trim() && t) form.setValue("transfermarkt_url", t);
    if (!(cur.instagram_url ?? "").trim() && i) form.setValue("instagram_url", i);
    if (!(cur.facebook_url ?? "").trim() && f) form.setValue("facebook_url", f);
    if (!(cur.other_social_url ?? "").trim() && o) form.setValue("other_social_url", o);
    if (!(cur.contract_end_date ?? "").trim() && ce) form.setValue("contract_end_date", ce);
    if (!(cur.nationality ?? "").trim() && nat) form.setValue("nationality", nat);
    if (!(cur.agent_name ?? "").trim() && an) form.setValue("agent_name", an);
    if (!(cur.agent_phone ?? "").trim() && ap) form.setValue("agent_phone", ap);
    if (!(cur.agent_email ?? "").trim() && ae) form.setValue("agent_email", ae);
    if (!(cur.club_formation ?? "").trim() && cf) form.setValue("club_formation", cf);
    if (!(cur.body_build ?? "").trim() && bb) form.setValue("body_build", bb);
  }, [selectedPlayerFull, form]);

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

  const autofillLeagueFromClub = useCallback(
    async (clubName: string, currentLeague: string, apply: (leagueName: string) => void) => {
      if (currentLeague.trim()) return;
      const club = await fetchClubByName(clubName);
      const leagueName = String(club?.league?.display_name ?? club?.league?.name ?? "").trim();
      if (leagueName) apply(leagueName);
    },
    []
  );

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

  const normalizeClubName = (name: string) =>
    name
      .replace(/\u00A0/g, " ")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim();

  const resolveClubId = async (clubName?: string) => {
    const raw = typeof clubName === "string" ? clubName : "";
    const normalized = normalizeClubName(raw);
    if (!normalized) return null;

    const { data: exactLikeRows, error: exactLikeErr } = await supabase
      .from("clubs")
      .select("id,name")
      .ilike("name", normalized)
      .limit(5);
    if (exactLikeErr) throw exactLikeErr;
    if ((exactLikeRows ?? []).length === 1 && (exactLikeRows as any)[0]?.id) {
      return (exactLikeRows as any)[0].id as string;
    }
    if ((exactLikeRows ?? []).length > 1) {
      const best = (exactLikeRows ?? []).find(
        (c) => normalizeClubName(String((c as any).name ?? "")) === normalized
      );
      if (best?.id) return best.id as string;
      return (exactLikeRows as any)[0].id as string;
    }

    const words = normalized.split(" ").filter(Boolean);
    if (words.length > 0) {
      const pattern = `%${words.join("%")}%`;
      const { data: candidates, error: candErr } = await supabase
        .from("clubs")
        .select("id,name")
        .ilike("name", pattern)
        .limit(10);
      if (candErr) throw candErr;

      const best = (candidates ?? []).find(
        (c) => normalizeClubName(String((c as any).name ?? "")) === normalized
      );
      if (best?.id) return best.id as string;
      if ((candidates ?? []).length === 1 && (candidates as any)[0]?.id) {
        return (candidates as any)[0].id as string;
      }
    }

    throw new Error(
      "Brak uprawnien do dodania klubu. Wybierz istniejacy klub lub zostaw pole puste."
    );
  };

  const resolveAgeCategoryIdForCurrentArea = async (birthYear: number): Promise<string | null> => {
    const y = Number(birthYear);
    if (!Number.isFinite(y)) return null;

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

    const { data: areaCats, error: catsErr } = await categoriesQ.limit(50);
    if (catsErr) throw catsErr;

    const cats = (areaCats ?? []) as Array<{
      id: string;
      age_under?: number | null;
      min_birth_year?: number | null;
      max_birth_year?: number | null;
    }>;

    const yearNow = new Date().getFullYear();
    const candidates = cats
      .map((c) => {
        const ageUnder = c.age_under ?? null;
        const minBy = c.min_birth_year ?? null;
        const maxBy = c.max_birth_year ?? null;
        const matchesAgeUnder = ageUnder != null && y === yearNow - Number(ageUnder);
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
    return (
      (typeof idFromCandidates === "string" && idFromCandidates.length > 0 ? idFromCandidates : null) ??
      (typeof idFromFallback === "string" && idFromFallback.length > 0 ? idFromFallback : null)
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
        // Jeśli edytujemy obserwację zawodnika z meczu i formularz nie blokuje pól zawodnika,
        // zapisujemy także zmiany w profilu zawodnika (players).
        if (!lockPlayerFields && prefillPlayer?.id) {
          const clubId = await resolveClubId(values.club_name?.trim());
          const birthYear = values.age ?? DEFAULT_BIRTH_YEAR;
          const ageCategoryId = await resolveAgeCategoryIdForCurrentArea(birthYear);
          await updatePlayer({
            id: prefillPlayer.id,
            input: {
              first_name: (values.first_name ?? "").trim(),
              last_name: (values.last_name ?? "").trim(),
              birth_year: birthYear,
              age_category_id: ageCategoryId ?? undefined,
              birth_date: values.birth_date?.trim() || null,
              contract_end_date: values.contract_end_date?.trim() || null,
              club_id: clubId ?? null,
              nationality: values.nationality?.trim() || null,
              body_build: values.body_build?.trim() || null,
              club_formation: normalizeFormationForSelect(values.club_formation)?.trim() || null,
              agent_name: values.agent_name?.trim() || null,
              agent_phone: values.agent_phone?.trim() || null,
              agent_email: values.agent_email?.trim() || null,
              transfermarkt_url: values.transfermarkt_url?.trim() || null,
              instagram_url: values.instagram_url?.trim() || null,
              facebook_url: values.facebook_url?.trim() || null,
              other_social_url: values.other_social_url?.trim() || null,
              primary_position: values.primary_position,
            },
          });
        }
        const positions = [
          codeForLookup(values.primary_position) || values.primary_position,
          ...(values.additional_positions ?? [])
            .filter((p) => p !== values.primary_position)
            .map((p) => codeForLookup(p) || p),
        ].filter(Boolean);
        await updateObservation({
          id: observationId,
          input: {
            source: values.source as ObservationSource,
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
            notes: values.notes?.trim() || null,
            positions: positions.length > 0 ? positions : null,
            overall_rating: null,
            strengths: values.strengths?.trim() || null,
            weaknesses: values.weaknesses?.trim() || null,
            photo_url: values.photo_url?.trim() || null,
            updated_by: user.id,
            updated_at: nowIso,
            updated_by_name: auditName,
            updated_by_role: auditRole,
            form_type: toDbFormType(values.form_type) ?? undefined,
            summary: values.summary?.trim() || null,
            recommendation: values.recommendation ?? null,
            match_performance_rating: values.match_performance_rating ?? null,
          },
        });
        if (matchObservationId) {
          await updateMatchObservation(matchObservationId, {
            home_team_formation: normalizeFormationForSelect(values.home_team_formation)?.trim() || null,
            away_team_formation: normalizeFormationForSelect(values.away_team_formation)?.trim() || null,
          });
        }
        if (!isMatchPlayer) {
          const payloadMatches: ObservationMatchInput[] = matchRows.map((m) => ({
            match_date: m.match_date,
            competition: m.competition?.trim() || null,
            league: m.league?.trim() || null,
            home_team: m.home_team?.trim() || null,
            away_team: m.away_team?.trim() || null,
            match_result: m.match_result?.trim() || null,
            source: m.source?.trim() || null,
            home_team_formation: normalizeFormationForSelect(m.home_team_formation)?.trim() || null,
            away_team_formation: normalizeFormationForSelect(m.away_team_formation)?.trim() || null,
            notes: m.notes?.trim() || null,
          }));
          await replaceObservationMatches(observationId, payloadMatches);
        }
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
            potential_now: values.potential_now,
            potential_future: values.potential_future,
            observation_date: values.match_date,
            competition: values.competition?.trim(),
            league: values.league?.trim() || undefined,
            home_team: values.home_team?.trim() || undefined,
            away_team: values.away_team?.trim() || undefined,
            match_result: values.match_result?.trim(),
            positions: offlinePositions.length > 0 ? offlinePositions : undefined,
            overall_rating: undefined,
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
            form_type: (values.form_type === "senior" ? "extended" : "simplified"),
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
              nationality: values.nationality?.trim() || null,
              body_build: values.body_build?.trim() || null,
              agent_name: values.agent_name?.trim() || null,
              agent_phone: values.agent_phone?.trim() || null,
              agent_email: values.agent_email?.trim() || null,
              club_formation: normalizeFormationForSelect(values.club_formation)?.trim() || null,
              primary_position: values.primary_position,
              contract_end_date: values.contract_end_date?.trim() || null,
              transfermarkt_url: values.transfermarkt_url?.trim() || null,
              instagram_url: values.instagram_url?.trim() || null,
              facebook_url: values.facebook_url?.trim() || null,
              other_social_url: values.other_social_url?.trim() || null,
            },
          });
        }
        if (!playerId) {
          const clubId = await resolveClubId(values.club_name?.trim());
          const ageCategoryId = resolveAgeCategoryId(birthYear);
          const player = await createPlayer({
            first_name: firstName,
            last_name: lastName,
            birth_year: birthYear,
            age_category_id: ageCategoryId,
            club_id: clubId,
            nationality: values.nationality?.trim() || null,
            body_build: values.body_build?.trim() || null,
            agent_name: values.agent_name?.trim() || null,
            agent_phone: values.agent_phone?.trim() || null,
            agent_email: values.agent_email?.trim() || null,
            club_formation: normalizeFormationForSelect(values.club_formation)?.trim() || null,
            primary_position: values.primary_position,
            pipeline_status: "unassigned",
            contract_end_date: values.contract_end_date?.trim() || null,
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
        const observation = await createObservation({
          player_id: playerId,
          scout_id: user.id,
          source: values.source as ObservationSource,
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
          notes: values.notes?.trim() || null,
          positions: positions.length > 0 ? positions : null,
          overall_rating: null,
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
          form_type: (values.form_type === "senior" ? "senior" : "academy"),
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
        if (!isMatchPlayer) {
          const payloadMatches: ObservationMatchInput[] = matchRows.map((m) => ({
            match_date: m.match_date,
            competition: m.competition?.trim() || null,
            league: m.league?.trim() || null,
            home_team: m.home_team?.trim() || null,
            away_team: m.away_team?.trim() || null,
            match_result: m.match_result?.trim() || null,
            source: m.source?.trim() || null,
            home_team_formation: normalizeFormationForSelect(m.home_team_formation)?.trim() || null,
            away_team_formation: normalizeFormationForSelect(m.away_team_formation)?.trim() || null,
            notes: m.notes?.trim() || null,
          }));
          await replaceObservationMatches(observation.id, payloadMatches);
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

  const handleInvalid = (errors: FieldErrors<WizardFormValues>) => {
    const firstField = Object.keys(errors)[0] as keyof WizardFormValues | undefined;
    if (firstField) {
      form.setFocus(firstField);
    }
    const flat: Array<{ name: string; message: string }> = [];
    for (const [name, err] of Object.entries(errors)) {
      const e = err as { message?: unknown } | undefined;
      const msg = typeof e?.message === "string" && e.message.trim() ? e.message.trim() : "Niepoprawna wartość";
      flat.push({ name, message: msg });
    }
    const preview = flat.slice(0, 6).map((e) => `${e.name}: ${e.message}`).join(" | ");
    setSubmitError(
      flat.length > 0
        ? `Formularz zawiera błędy: ${preview}${flat.length > 6 ? " | ..." : ""}`
        : "Uzupełnij wymagane pola w formularzu."
    );
    toast({
      variant: "destructive",
      title: "Nie można zapisać",
      description:
        flat.length > 0
          ? `Błędy: ${preview}${flat.length > 6 ? " | ..." : ""}`
          : "Formularz zawiera błędy. Sprawdź pola oznaczone na czerwono.",
    });
  };

  const hasSelectedPlayer =
    Boolean(form.watch("player_id")) ||
    Boolean(lockPlayerFields && prefillPlayer?.id) ||
    isEditMode;
  const showPlayerActions = !lockPlayerFields && !prefillPlayer;
  const isMatchPlayerEdit = isEditMode && isMatchPlayer;

  useEffect(() => {
    if (!isMatchPlayerEdit) return;
    const currentSource = String(form.getValues("source") ?? "").trim();
    if (!currentSource || !OBSERVATION_SOURCE_VALID.has(currentSource)) {
      form.setValue("source", defaultSourceValue, { shouldDirty: false, shouldTouch: false });
    }
    const currentDate = String(form.getValues("match_date") ?? "").trim();
    if (!currentDate) {
      form.setValue("match_date", format(new Date(), "yyyy-MM-dd"), { shouldDirty: false, shouldTouch: false });
    }
  }, [isMatchPlayerEdit, form, defaultSourceValue]);

  return (
    <div className="min-h-0 space-y-4 pb-24 lg:pb-0">
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
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Imię <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Jan" {...field} value={field.value ?? ""} />
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
                          <Input placeholder="Kowalski" {...field} value={field.value ?? ""} />
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
                        <FormLabel>Narodowość</FormLabel>
                        <FormControl>
                          <Input placeholder="Polska" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
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
                        <FormLabel>Data urodzenia</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="body_build"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budowa ciała</FormLabel>
                        <Select
                          value={field.value || "__none__"}
                          onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        >
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
                              <SelectValue placeholder="Wybierz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— Brak —</SelectItem>
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
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
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
                    name="club_formation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formacja drużyny</FormLabel>
                        <Select
                          value={normalizeFormationForSelect(field.value) || "__none__"}
                          onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        >
                          <FormControl>
                            <SelectTrigger ref={field.ref}>
                              <SelectValue placeholder="Wybierz schemat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— Brak —</SelectItem>
                            {(formations as { id: string; name: string; code?: string | null }[])
                              .filter((f) => formationOptionValue(f).trim() !== "")
                              .map((f) => (
                                <SelectItem key={f.id} value={formationOptionValue(f)}>
                                  {f.name}
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
                    name="contract_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Koniec kontraktu</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">1a. Dane agenta</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imię i nazwisko</FormLabel>
                    <FormControl>
                      <Input placeholder="np. Jan Kowalski" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="+48 600 000 000" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agent_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="agent@email.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Źródło <span className="text-red-600">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isMatchPlayerEdit}>
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder="Wybierz źródło" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                                {matchSourceOptions.map((opt) => (
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
                      <Input type="date" {...field} disabled={isMatchPlayerEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="league"
                render={({ field }) => {
                  const leagueValue =
                    field.value && String(field.value).trim() !== "" ? field.value : "__none__";
                  return (
                  <FormItem>
                    <FormLabel>Liga</FormLabel>
                    <Select
                      value={leagueValue}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      disabled={isMatchPlayerEdit}
                    >
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder="Wybierz ligę" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">— Brak —</SelectItem>
                        {(leagueOptions as Record<string, unknown>[])
                          .filter((l) => String(l.display_name ?? l.name ?? "").trim() !== "")
                          .map((l) => {
                            const value = String(l.display_name ?? l.name ?? "");
                            return (
                              <SelectItem key={String(l.id)} value={value}>
                                {value}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                  );
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {showCompetitionField && (
                <FormField
                  control={form.control}
                  name="competition"
                  render={({ field }) => {
                    const competitionValue =
                      field.value && String(field.value).trim() !== "" ? field.value : "__none__";
                    return (
                      <FormItem>
                        <FormLabel>Kategoria wiekowa</FormLabel>
                        <Select
                          value={competitionValue}
                          onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                          disabled={isMatchPlayerEdit}
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
              )}
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
                        <ClubSelect
                          value={field.value ?? ""}
                          onChange={(v) => {
                            field.onChange(v);
                            void autofillLeagueFromClub(v, form.getValues("league") ?? "", (leagueName) =>
                              form.setValue("league", leagueName, { shouldDirty: true, shouldTouch: true })
                            );
                          }}
                          placeholder="Wpisz lub wybierz klub..."
                            disabled={isMatchPlayerEdit}
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
                        <ClubSelect
                          value={field.value ?? ""}
                          onChange={(v) => {
                            field.onChange(v);
                            void autofillLeagueFromClub(v, form.getValues("league") ?? "", (leagueName) =>
                              form.setValue("league", leagueName, { shouldDirty: true, shouldTouch: true })
                            );
                          }}
                          placeholder="Wpisz lub wybierz klub..."
                            disabled={isMatchPlayerEdit}
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
                          disabled={isMatchPlayerEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {form.watch("source") !== "tournament" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="home_team_formation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formacja gospodarzy</FormLabel>
                      <Select
                        value={normalizeFormationForSelect(field.value) || "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        disabled={isMatchPlayerEdit}
                      >
                        <FormControl>
                          <SelectTrigger ref={field.ref}>
                            <SelectValue placeholder="Wybierz schemat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">— Brak —</SelectItem>
                          {(formations as { id: string; name: string; code?: string | null }[])
                            .filter((f) => formationOptionValue(f).trim() !== "")
                            .map((f) => (
                            <SelectItem key={f.id} value={formationOptionValue(f)}>
                              {f.name}
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
                  name="away_team_formation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formacja gości</FormLabel>
                      <Select
                        value={normalizeFormationForSelect(field.value) || "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        disabled={isMatchPlayerEdit}
                      >
                        <FormControl>
                          <SelectTrigger ref={field.ref}>
                            <SelectValue placeholder="Wybierz schemat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">— Brak —</SelectItem>
                          {(formations as { id: string; name: string; code?: string | null }[])
                            .filter((f) => formationOptionValue(f).trim() !== "")
                            .map((f) => (
                            <SelectItem key={f.id} value={formationOptionValue(f)}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="hidden sm:block" />
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
                        : "Notatki do meczu (max 2000 znaków)"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notatki do meczu..."
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[80px]"
                      maxLength={2000}
                      disabled={isMatchPlayerEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isMatchPlayer && (
              <div className="space-y-3">
                <div className="space-y-3 rounded-md border border-slate-200 p-3">
                  <h3 className="text-sm font-semibold text-slate-700">Powiązane mecze</h3>

                  {matchRows.length === 0 ? (
                    <div className="text-xs text-slate-500">Brak powiązanych meczów.</div>
                  ) : (
                    matchRows.map((row, idx) => (
                      <div key={row.id} className="space-y-2 rounded border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-medium text-slate-600">
                            {row.isSaved
                              ? `${row.match_date || "brak daty"} | ${row.home_team || "?"} - ${row.away_team || "?"}${row.match_result ? ` (${row.match_result})` : ""}`
                              : `Mecz #${idx + 1}`}
                          </div>
                          <div className="flex gap-2">
                            {row.isSaved ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setMatchRows((prev) =>
                                    prev.map((m) => (m.id === row.id ? { ...m, isSaved: false } : m))
                                  )
                                }
                              >
                                Edytuj
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  if (!(row.source ?? "").trim() || !(row.match_date ?? "").trim()) {
                                    toast({
                                      variant: "destructive",
                                      title: "Uzupełnij dane meczu",
                                      description: "Dla powiązanego meczu wymagane są: Źródło i Data meczu.",
                                    });
                                    return;
                                  }
                                  setMatchRows((prev) =>
                                    prev.map((m) => (m.id === row.id ? { ...m, isSaved: true } : m))
                                  );
                                }}
                              >
                                Zapisz
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMatchRows((prev) => prev.filter((m) => m.id !== row.id))}
                            >
                              Usuń
                            </Button>
                          </div>
                        </div>
                        {!row.isSaved && (
                          <div className="grid gap-2 sm:grid-cols-3">
                            <Select
                              value={row.source || "__none__"}
                              onValueChange={(v) =>
                                setMatchRows((prev) =>
                                  prev.map((m) => (m.id === row.id ? { ...m, source: v === "__none__" ? "" : v } : m))
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Źródło *" />
                              </SelectTrigger>
                              <SelectContent>
                                {individualSourceOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={row.match_date}
                              onChange={(e) =>
                                setMatchRows((prev) => prev.map((m) => (m.id === row.id ? { ...m, match_date: e.target.value } : m)))
                              }
                            />
                            {showCompetitionField && (
                              <Select
                                value={row.competition && String(row.competition).trim() !== "" ? row.competition : "__none__"}
                                onValueChange={(v) =>
                                  setMatchRows((prev) =>
                                    prev.map((m) => (m.id === row.id ? { ...m, competition: v === "__none__" ? "" : v } : m))
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Kategoria wiekowa" />
                                </SelectTrigger>
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
                            )}
                            <Select
                              value={row.league && String(row.league).trim() !== "" ? row.league : "__none__"}
                              onValueChange={(v) =>
                                setMatchRows((prev) =>
                                  prev.map((m) => (m.id === row.id ? { ...m, league: v === "__none__" ? "" : v } : m))
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Liga" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Brak —</SelectItem>
                                {(leagueOptions as Record<string, unknown>[])
                                  .filter((l) => String(l.display_name ?? l.name ?? "").trim() !== "")
                                  .map((l) => {
                                    const value = String(l.display_name ?? l.name ?? "");
                                    return (
                                      <SelectItem key={String(l.id)} value={value}>
                                        {value}
                                      </SelectItem>
                                    );
                                  })}
                              </SelectContent>
                            </Select>
                            <ClubSelect
                              value={row.home_team ?? ""}
                              onChange={(v) => {
                                setMatchRows((prev) => prev.map((m) => (m.id === row.id ? { ...m, home_team: v } : m)));
                                void autofillLeagueFromClub(v, row.league ?? "", (leagueName) =>
                                  setMatchRows((prev) =>
                                    prev.map((m) =>
                                      m.id === row.id && !(m.league ?? "").trim() ? { ...m, league: leagueName } : m
                                    )
                                  )
                                );
                              }}
                              placeholder="Wpisz lub wybierz gospodarza..."
                            />
                            <ClubSelect
                              value={row.away_team ?? ""}
                              onChange={(v) => {
                                setMatchRows((prev) => prev.map((m) => (m.id === row.id ? { ...m, away_team: v } : m)));
                                void autofillLeagueFromClub(v, row.league ?? "", (leagueName) =>
                                  setMatchRows((prev) =>
                                    prev.map((m) =>
                                      m.id === row.id && !(m.league ?? "").trim() ? { ...m, league: leagueName } : m
                                    )
                                  )
                                );
                              }}
                              placeholder="Wpisz lub wybierz gościa..."
                            />
                            <Input
                              placeholder="Wynik (np. 2:1)"
                              value={row.match_result ?? ""}
                              onChange={(e) =>
                                setMatchRows((prev) => prev.map((m) => (m.id === row.id ? { ...m, match_result: e.target.value } : m)))
                              }
                            />
                            <Select
                              value={normalizeFormationForSelect(row.home_team_formation) || "__none__"}
                              onValueChange={(v) =>
                                setMatchRows((prev) =>
                                  prev.map((m) => (m.id === row.id ? { ...m, home_team_formation: v === "__none__" ? "" : v } : m))
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Formacja gospodarzy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Brak —</SelectItem>
                                {(formations as { id: string; name: string; code?: string | null }[])
                                  .filter((f) => formationOptionValue(f).trim() !== "")
                                  .map((f) => (
                                    <SelectItem key={f.id} value={formationOptionValue(f)}>
                                      {f.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={normalizeFormationForSelect(row.away_team_formation) || "__none__"}
                              onValueChange={(v) =>
                                setMatchRows((prev) =>
                                  prev.map((m) => (m.id === row.id ? { ...m, away_team_formation: v === "__none__" ? "" : v } : m))
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Formacja gości" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Brak —</SelectItem>
                                {(formations as { id: string; name: string; code?: string | null }[])
                                  .filter((f) => formationOptionValue(f).trim() !== "")
                                  .map((f) => (
                                    <SelectItem key={f.id} value={formationOptionValue(f)}>
                                      {f.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Notatki do meczu..."
                              value={row.notes ?? ""}
                              onChange={(e) =>
                                setMatchRows((prev) => prev.map((m) => (m.id === row.id ? { ...m, notes: e.target.value } : m)))
                              }
                              className="min-h-[80px] sm:col-span-3"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMatchRows((prev) => [
                        ...prev,
                        {
                          id: uuidv4(),
                          match_date: format(new Date(), "yyyy-MM-dd"),
                          source: defaultSourceValue,
                          competition: "",
                          league: "",
                          home_team: "",
                          away_team: "",
                          match_result: "",
                          home_team_formation: "",
                          away_team_formation: "",
                          notes: "",
                          isSaved: false,
                        },
                      ])
                    }
                  >
                    + Dodaj mecz
                  </Button>
                </div>
              </div>
            )}
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
                Skala 1–5.
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
                                field.value === v
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
              {/* Usunięto prezentację „Ocena ogólna”. */}
            </section>
          )}

          {formType === "senior" && primaryPosition && !isMatchPlayer && (
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
                                  field.value === v
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
                      placeholder="Opis, mocne i słabe strony, porównanie do nasego zawodnika"
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
                    <div className="flex w-full gap-2">
                      {(["negative", "to_observe", "positive"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => field.onChange(r)}
                          className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                            (field.value ?? "to_observe") === r
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {r === "positive" ? "Pozytywna" : r === "to_observe" ? "Do obserwacji" : "Negatywna"}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditMode && isMatchPlayer ? (
              <>
                <FormField
                  control={form.control}
                  name="match_performance_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ocena za występ (1–5)</FormLabel>
                      <FormControl>
                        <div className="grid w-full grid-cols-3 gap-2 lg:grid-cols-9">
                          {HALF_STEP_VALUES.map((v) => (
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
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="potential_now"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance</FormLabel>
                      <FormControl>
                        <div className="grid w-full grid-cols-3 gap-2 lg:grid-cols-9">
                          {HALF_STEP_VALUES.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => field.onChange(v)}
                              className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                                field.value === v
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
                        <div className="grid w-full grid-cols-3 gap-2 lg:grid-cols-9">
                          {HALF_STEP_VALUES.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => field.onChange(v)}
                              className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                                field.value === v
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

          <div className="hidden flex-wrap items-center justify-between gap-2 lg:flex">
            <div className="flex flex-wrap items-center gap-2">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 lg:hidden">
        <Button
          type="button"
          className="w-full"
          disabled={isSaving}
          onClick={() => form.handleSubmit(onSubmit, handleInvalid)()}
        >
          {isSaving ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Zapisz obserwację"}
        </Button>
      </div>
    </div>
  );
}
