import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useObservation } from "@/features/observations/hooks/useObservations";
import { ObservationWizard } from "@/features/observations/components/ObservationWizard";
import { fetchMatchObservationById } from "@/features/observations/api/matchObservations.api";
import { fetchObservationMatches } from "@/features/observations/api/observationMatches.api";
import { mapLegacyPosition } from "@/features/players/positions";
import { useMultimediaByObservation, useDeleteMultimedia } from "@/features/multimedia";
import { useFormations } from "@/features/tactical/hooks/useFormations";

export function EditObservationPage() {
  const { id } = useParams();
  const observationId = id ?? "";
  const { data: observation, isLoading } = useObservation(observationId);
  const { data: savedMedia = [] } = useMultimediaByObservation(observationId);
  const deleteMultimedia = useDeleteMultimedia(observation?.player_id ?? "");
  const matchObservationId = observation?.match_observation_id ?? null;
  const { data: matchObservation } = useQuery({
    queryKey: ["match-observation", matchObservationId],
    queryFn: () => fetchMatchObservationById(matchObservationId!),
    enabled: !!matchObservationId,
  });
  const { data: observationMatches = [] } = useQuery({
    queryKey: ["observation-matches", observationId],
    queryFn: () => fetchObservationMatches(observationId),
    enabled: Boolean(observationId),
  });
  const { data: formations = [] } = useFormations();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const normalizeFormationValue = useMemo(() => {
    const formationOptionValue = (f: { id: string; code?: string | null }) => {
      const code = String(f.code ?? "").trim();
      return code || f.id;
    };
    const mapById = new Map(
      (formations as { id: string; code?: string | null }[]).map((f) => [f.id, formationOptionValue(f)])
    );
    return (value?: string | null) => {
      const v = String(value ?? "").trim();
      if (!v) return "";
      return mapById.get(v) ?? v;
    };
  }, [formations]);

  const initialValues = useMemo(() => {
    if (!observation) return undefined;
    const primary =
      observation.positions?.[0] != null
        ? mapLegacyPosition(observation.positions[0])
        : observation.player?.primary_position
          ? mapLegacyPosition(observation.player.primary_position)
          : "";
    const additional =
      observation.positions?.slice(1).map((p) => mapLegacyPosition(p)) ?? [];
    const matchesFromTable =
      observationMatches.length > 0
        ? observationMatches.map((m) => ({
            match_date: m.match_date,
            competition: m.competition ?? "",
            league: m.league ?? "",
            home_team: m.home_team ?? "",
            away_team: m.away_team ?? "",
            match_result: m.match_result ?? "",
            source: m.source ?? (observation.source ?? "live_match"),
            home_team_formation: normalizeFormationValue(m.home_team_formation),
            away_team_formation: normalizeFormationValue(m.away_team_formation),
            notes: m.notes ?? "",
          }))
        : null;
    const primaryMatch = matchesFromTable?.[0];

    return {
      player_id: observation.player_id,
      observation_category: (observation.observation_category === "match_player" ? "match_player" : "individual") as "match_player" | "individual",
      first_name: observation.player?.first_name ?? "",
      last_name: observation.player?.last_name ?? "",
      nationality: (observation.player as { nationality?: string | null } | null)?.nationality ?? "Polska",
      age: observation.player?.birth_year ?? currentYear - 16,
      birth_date: ((observation.player as { birth_date?: string | null } | null)?.birth_date ?? "")?.slice(0, 10) || "",
      body_build: (observation.player as { body_build?: string | null } | null)?.body_build ?? "",
      club_formation: normalizeFormationValue(
        (observation.player as { club_formation?: string | null } | null)?.club_formation
      ),
      agent_name: (observation.player as { agent_name?: string | null } | null)?.agent_name ?? "",
      agent_phone: (observation.player as { agent_phone?: string | null } | null)?.agent_phone ?? "",
      agent_email: (observation.player as { agent_email?: string | null } | null)?.agent_email ?? "",
      club_name: observation.player?.club?.name ?? "",
      match_date:
        primaryMatch?.match_date ??
        (observation.observation_date
          ? format(new Date(observation.observation_date), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd")),
      competition:
        primaryMatch?.competition ??
        (observation.observation_category === "match_player" && matchObservation
          ? (matchObservation.competition ?? observation.competition ?? "")
          : (observation.competition ?? "")),
      league:
        primaryMatch?.league ??
        (observation.observation_category === "match_player" && matchObservation
          ? (matchObservation.league ?? observation.league ?? "")
          : (observation.league ?? "")),
      home_team:
        primaryMatch?.home_team ??
        (observation.observation_category === "match_player" && matchObservation
          ? (matchObservation.home_team ?? observation.home_team ?? "")
          : (observation.home_team ?? "")),
      away_team:
        primaryMatch?.away_team ??
        (observation.observation_category === "match_player" && matchObservation
          ? (matchObservation.away_team ?? observation.away_team ?? "")
          : (observation.away_team ?? "")),
      match_result:
        primaryMatch?.match_result ??
        (observation.observation_category === "match_player" && matchObservation
          ? (matchObservation.match_result ?? observation.match_result ?? "")
          : (observation.match_result ?? "")),
      source: primaryMatch?.source ?? observation.source ?? "live_match",
      matches:
        matchesFromTable ??
        [
          {
            match_date: observation.observation_date
              ? format(new Date(observation.observation_date), "yyyy-MM-dd")
              : format(new Date(), "yyyy-MM-dd"),
            competition:
              observation.observation_category === "match_player" && matchObservation
                ? (matchObservation.competition ?? observation.competition ?? "")
                : (observation.competition ?? ""),
            league:
              observation.observation_category === "match_player" && matchObservation
                ? (matchObservation.league ?? observation.league ?? "")
                : (observation.league ?? ""),
            home_team:
              observation.observation_category === "match_player" && matchObservation
                ? (matchObservation.home_team ?? observation.home_team ?? "")
                : (observation.home_team ?? ""),
            away_team:
              observation.observation_category === "match_player" && matchObservation
                ? (matchObservation.away_team ?? observation.away_team ?? "")
                : (observation.away_team ?? ""),
            match_result:
              observation.observation_category === "match_player" && matchObservation
                ? (matchObservation.match_result ?? observation.match_result ?? "")
                : (observation.match_result ?? ""),
            source: observation.source ?? "live_match",
            home_team_formation: normalizeFormationValue(matchObservation?.home_team_formation),
            away_team_formation: normalizeFormationValue(matchObservation?.away_team_formation),
            notes: "",
          },
        ],
      notes:
        observation.observation_category === "match_player"
          ? (matchObservation?.match_notes ?? observation.notes ?? "")
          : (observation.notes ?? ""),
      primary_position: primary,
      additional_positions: additional,
      technical_rating: observation.technical_rating ?? undefined,
      speed_rating: observation.speed_rating ?? undefined,
      motor_rating: observation.motor_rating ?? undefined,
      motor_speed_rating: observation.motor_speed_rating ?? 3,
      motor_endurance_rating: observation.motor_endurance_rating ?? 3,
      motor_jump_rating: observation.motor_jump_rating ?? 3,
      motor_agility_rating: observation.motor_agility_rating ?? 3,
      motor_acceleration_rating: observation.motor_acceleration_rating ?? 3,
      motor_strength_rating: observation.motor_strength_rating ?? 3,
      tactical_rating: observation.tactical_rating ?? undefined,
      mental_rating: observation.mental_rating ?? undefined,
      potential_now: observation.potential_now ?? undefined,
      potential_future: observation.potential_future ?? undefined,
      overall_rating: observation.overall_rating ?? undefined,
      strengths: observation.strengths ?? "",
      weaknesses: observation.weaknesses ?? "",
      photo_url: observation.photo_url ?? "",
      rank: observation.rank ?? undefined,
      form_type: observation.form_type === "extended" ? "senior" : observation.form_type === "simplified" ? "academy" : (observation.form_type ?? "academy"),
      summary: observation.summary ?? "",
      recommendation: observation.recommendation ?? undefined,
      match_performance_rating:
        typeof observation.match_performance_rating === "number"
          ? Math.min(5, Math.max(1, observation.match_performance_rating))
          : undefined,
      home_team_formation:
        normalizeFormationValue(
          matchObservation?.home_team_formation ??
          matchesFromTable?.[0]?.home_team_formation
        ),
      away_team_formation:
        normalizeFormationValue(
          matchObservation?.away_team_formation ??
          matchesFromTable?.[0]?.away_team_formation
        ),
    };
  }, [observation, matchObservation, observationMatches, currentYear, normalizeFormationValue]);

  const prefillPlayer = useMemo(() => {
    if (!observation?.player) return undefined;
    return {
      id: observation.player_id,
      first_name: observation.player.first_name ?? "",
      last_name: observation.player.last_name ?? "",
      birth_year: observation.player.birth_year ?? currentYear - 16,
      club_name: observation.player.club?.name,
      primary_position: observation.player.primary_position
        ? mapLegacyPosition(observation.player.primary_position)
        : undefined,
    };
  }, [observation, currentYear]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ładowanie...</p>;
  }

  if (!observation) {
    return <p className="text-sm text-slate-500">Nie znaleziono obserwacji.</p>;
  }

  const handleRemoveSavedMedia = (mediaId: string) => {
    deleteMultimedia.mutate(mediaId);
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <ObservationWizard
        mode="edit"
        observationId={observationId}
        matchObservationId={matchObservationId ?? undefined}
        initialValues={initialValues}
        prefillPlayer={prefillPlayer}
        lockPlayerFields={false}
        cancelHref={`/observations/${observationId}`}
        savedMedia={savedMedia}
        onRemoveSavedMedia={handleRemoveSavedMedia}
      />
    </div>
  );
}
