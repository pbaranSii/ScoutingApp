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
  fetchPlayerEvaluationsByObservation,
  replacePlayerEvaluations,
  savePlayerEvaluations,
  type EvaluationCriterion,
} from "../api/evaluationCriteria.api";
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
import { POSITION_OPTIONS, mapLegacyPosition } from "@/features/players/positions";
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

const wizardSchema = z
  .object({
    player_id: z.string().uuid().optional().nullable(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    age: z.coerce.number().int().min(8).max(50).optional(),
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
    strengths_notes: z.string().optional(),
    weaknesses: z.string().optional(),
    weaknesses_notes: z.string().optional(),
  notes: z.string().optional(),
  photo_url: z.string().optional(),
  rank: z.string().min(1, "Wybierz range"),
  source: z.string().min(1, "Wybierz zrodlo"),
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
    if (!Number.isFinite(data.age) || (data.age ?? 0) < 8 || (data.age ?? 0) > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Podaj wiek (8–50)",
        path: ["age"],
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

  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);
  const [positionScores, setPositionScores] = useState<Record<string, number>>({});

  const form = useForm<WizardFormValues, unknown, WizardFormValues>({
    resolver: zodResolver(wizardSchema) as Resolver<WizardFormValues>,
    defaultValues: {
      player_id: null,
      first_name: "",
      last_name: "",
      age: 16,
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
      overall_rating: undefined,
      strengths: "",
      strengths_notes: "",
      weaknesses: "",
      weaknesses_notes: "",
      rank: "B",
      source: "scouting",
      notes: "",
      photo_url: "",
    },
  });

  const primaryPosition = form.watch("primary_position");
  const { data: positionCriteria = [] } = useQuery({
    queryKey: ["evaluation-criteria", primaryPosition],
    queryFn: () => fetchEvaluationCriteriaByPositionCode(primaryPosition || ""),
    enabled: Boolean(primaryPosition?.trim()),
  });

  const isEditMode = mode === "edit" && Boolean(observationId);
  const { data: existingPositionScores } = useQuery({
    queryKey: ["player-evaluations", observationId],
    queryFn: () => fetchPlayerEvaluationsByObservation(observationId!),
    enabled: isEditMode,
  });

  const setCriteriaScore = (criteriaId: string, score: number) => {
    setPositionScores((prev) => ({ ...prev, [criteriaId]: score }));
  };

  useEffect(() => {
    if (isEditMode && initialValues) {
      form.reset(initialValues as WizardFormValues);
    }
  }, [isEditMode, initialValues, form]);

  useEffect(() => {
    if (isEditMode && existingPositionScores?.length) {
      const next: Record<string, number> = {};
      for (const { criteria_id, score } of existingPositionScores) {
        next[criteria_id] = score;
      }
      setPositionScores(next);
    }
  }, [isEditMode, existingPositionScores]);

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
      form.setValue("age", currentYear - prefillPlayer.birth_year);
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
    form.setValue("age", currentYear - player.birth_year);
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
    const age = v.age;
    if (age == null || !Number.isFinite(age) || age < 8 || age > 50) return;
    const birthYear = currentYear - age;
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
  }, [form, currentYear]);

  const handleConfirmNewDespiteDuplicates = () => {
    setIgnoreDuplicates(true);
    setDuplicateDialogOpen(false);
  };

  const handleSelectExistingFromDuplicate = (player: DuplicateCandidate) => {
    form.setValue("player_id", player.id);
    form.setValue("first_name", player.first_name ?? "");
    form.setValue("last_name", player.last_name ?? "");
    form.setValue("age", currentYear - player.birth_year);
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
      setSubmitError("Brak zalogowanego uzytkownika");
      return;
    }
    setSubmitError(null);

    if (isEditMode && observationId) {
      try {
        const nowIso = new Date().toISOString();
        const positions = [
          values.primary_position,
          ...(values.additional_positions ?? []).filter((p) => p !== values.primary_position),
        ];
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
            notes: values.notes?.trim() || null,
            technical_rating: values.technical_rating ?? null,
            speed_rating: values.speed_rating ?? null,
            motor_rating: values.motor_rating ?? null,
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
            strengths_notes: values.strengths_notes?.trim() || null,
            weaknesses: values.weaknesses?.trim() || null,
            weaknesses_notes: values.weaknesses_notes?.trim() || null,
            photo_url: values.photo_url?.trim() || null,
            updated_by: user.id,
            updated_at: nowIso,
            updated_by_name: auditName,
            updated_by_role: auditRole,
          },
        });
        try {
          await replacePlayerEvaluations(
            observationId,
            Object.entries(positionScores).map(([criteria_id, score]) => ({ criteria_id, score }))
          );
        } catch (evalErr) {
          console.error("Position evaluations save failed:", evalErr);
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
        setSubmitError("Nie udalo sie zapisac zmian");
        toast({
          variant: "destructive",
          title: "Nie udalo sie zapisac",
          description: "Sprobuj ponownie za chwile.",
        });
      }
      return;
    }

    const firstName = (values.first_name ?? "").trim();
    const lastName = (values.last_name ?? "").trim();
    const birthYear = currentYear - (values.age ?? 16);
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
            notes: values.notes,
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
            tactical_rating: values.tactical_rating ?? undefined,
            mental_rating: values.mental_rating ?? undefined,
            strengths: values.strengths?.trim(),
            strengths_notes: values.strengths_notes?.trim(),
            weaknesses: values.weaknesses?.trim(),
            weaknesses_notes: values.weaknesses_notes?.trim(),
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
          values.primary_position,
          ...(values.additional_positions ?? []).filter((p) => p !== values.primary_position),
        ];
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
          notes: values.notes,
          technical_rating: values.technical_rating ?? null,
          speed_rating: values.speed_rating ?? null,
          motor_rating: values.motor_rating ?? null,
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
          strengths_notes: values.strengths_notes?.trim() || null,
          weaknesses: values.weaknesses?.trim() || null,
          weaknesses_notes: values.weaknesses_notes?.trim() || null,
          photo_url: values.photo_url?.trim() || null,
          created_by: user.id,
          created_by_name: auditName,
          created_by_role: auditRole,
          updated_by: user.id,
          updated_by_name: auditName,
          updated_by_role: auditRole,
          updated_at: nowIso,
        });
        if (Object.keys(positionScores).length > 0) {
          try {
            await savePlayerEvaluations(
              observation.id,
              Object.entries(positionScores).map(([criteria_id, score]) => ({ criteria_id, score }))
            );
          } catch (evalErr) {
            console.error("Position evaluations save failed:", evalErr);
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
      setPositionScores({});
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

  const hasSelectedPlayer =
    Boolean(form.watch("player_id")) ||
    Boolean(lockPlayerFields && prefillPlayer?.id) ||
    isEditMode;
  const showPlayerActions = !lockPlayerFields && !prefillPlayer;

  return (
    <div className="space-y-4">
      <PlayerSearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectPlayer={handleSelectPlayer}
        onAddNew={handleAddNewPlayer}
      />
      <DuplicateWarningDialog
        open={duplicateDialogOpen}
        candidateDisplay={`${form.watch("first_name") ?? ""} ${form.watch("last_name") ?? ""}, ${currentYear - (form.watch("age") ?? 16)}, ${form.watch("club_name") ?? "—"}`}
        duplicates={duplicateCandidates}
        onSelectExisting={handleSelectExistingFromDuplicate}
        onConfirmNew={handleConfirmNewDespiteDuplicates}
        onClose={() => setDuplicateDialogOpen(false)}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleInvalid)} className="space-y-6">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddNewPlayer()}
                >
                  Dodaj nowego zawodnika
                </Button>
              </div>
            )}
            {hasSelectedPlayer && showPlayerActions && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">
                  Zawodnik: {form.watch("first_name") ?? ""} {form.watch("last_name") ?? ""} | Rok urodzenia: {currentYear - (form.watch("age") ?? 16)} | {form.watch("club_name") ?? "—"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      form.getValues("competition") ||
                      form.getValues("notes") ||
                      form.getValues("strengths") ||
                      form.getValues("weaknesses")
                    ) {
                      if (window.confirm("Zmiana zawodnika usunie niewysłane dane obserwacji. Kontynuować?")) {
                        form.setValue("player_id", null);
                        form.setValue("first_name", "");
                        form.setValue("last_name", "");
                        form.setValue("age", 16);
                        form.setValue("club_name", "");
                        form.setValue("primary_position", "");
                        setSearchDialogOpen(true);
                      }
                    } else {
                      form.setValue("player_id", null);
                      form.setValue("first_name", "");
                      form.setValue("last_name", "");
                      form.setValue("age", 16);
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
                      Wiek <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={8}
                        max={50}
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={lockPlayerFields && Boolean(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger ref={field.ref} className="flex-1">
                          <SelectValue placeholder="Wybierz pozycję" />
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
            <FormField
              control={form.control}
              name="additional_positions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dodatkowe pozycje</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {POSITION_OPTIONS.filter((opt) => opt.code !== form.watch("primary_position")).map((option) => {
                      const selected = (field.value ?? []).includes(option.code);
                      return (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              field.onChange((field.value ?? []).filter((c) => c !== option.code));
                            } else {
                              field.onChange([...(field.value ?? []), option.code]);
                            }
                          }}
                          className={`rounded-full px-3 py-1.5 text-sm transition ${
                            selected
                              ? "bg-slate-800 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {option.code}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">4. Oceny ogólne</h2>
            <p className="text-xs text-slate-500">Skala 1–5. Ogólna ocena (1–10) jest wyliczana automatycznie.</p>
            {(
              [
                { name: "technical_rating" as const, label: "Technika" },
                { name: "speed_rating" as const, label: "Szybkość" },
                { name: "motor_rating" as const, label: "Motoryka" },
                { name: "tactical_rating" as const, label: "Taktyka" },
                { name: "mental_rating" as const, label: "Mentalność" },
                { name: "potential_now" as const, label: "Potencjał obecny" },
                { name: "potential_future" as const, label: "Potencjał przyszły" },
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

            {primaryPosition && positionCriteria.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-slate-700 pt-4">5. Oceny specyficzne dla pozycji</h3>
                <p className="text-xs text-slate-500">
                  Oceny dla pozycji: {POSITION_OPTIONS.find((p) => p.code === primaryPosition)?.label ?? primaryPosition}
                </p>
                <div className="space-y-3">
                  {(positionCriteria as EvaluationCriterion[]).map((c) => (
                    <div key={c.id} className="flex flex-wrap items-center gap-2">
                      <span className="w-40 text-sm font-medium text-slate-700">{c.name}</span>
                      <div className="flex w-full flex-1 gap-2 min-w-0">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setCriteriaScore(c.id, v)}
                            className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition touch-manipulation ${
                              (positionScores[c.id] ?? 3) === v
                                ? "border-slate-700 bg-slate-700 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-800">5. Analiza i notatki</h2>
            <FormField
              control={form.control}
              name="strengths"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <StrengthsWeaknessesTagField
                      label="Mocne strony"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      dictionaryOptions={(strengthsOptions as { id: string; name_pl: string }[]).map(
                        (r) => ({ id: r.id, name_pl: String(r.name_pl) })
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="strengths_notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatkowy opis mocnych stron, niezależny od tagów powyżej."
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="min-h-[72px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weaknesses"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <StrengthsWeaknessesTagField
                      label="Słabe strony"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      dictionaryOptions={(weaknessesOptions as { id: string; name_pl: string }[]).map(
                        (r) => ({ id: r.id, name_pl: String(r.name_pl) })
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weaknesses_notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatkowy opis słabych stron, niezależny od tagów powyżej."
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="min-h-[72px]"
                    />
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
                    <Textarea placeholder="Szczegółowa analiza występu, rekomendacje, itp." value={field.value ?? ""} onChange={field.onChange} className="min-h-[80px]" />
                  </FormControl>
                </FormItem>
              )}
            />
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
              {isSaving ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Zapisz obserwacje"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
