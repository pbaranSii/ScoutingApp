import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useObservation } from "@/features/observations/hooks/useObservations";
import { ObservationWizard } from "@/features/observations/components/ObservationWizard";
import { fetchMatchObservationById } from "@/features/observations/api/matchObservations.api";
import { mapLegacyPosition } from "@/features/players/positions";
import { useMultimediaByObservation, useDeleteMultimedia } from "@/features/multimedia";

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

  const currentYear = useMemo(() => new Date().getFullYear(), []);

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
    return {
      player_id: observation.player_id,
      observation_category: (observation.observation_category === "match_player" ? "match_player" : "individual") as "match_player" | "individual",
      first_name: observation.player?.first_name ?? "",
      last_name: observation.player?.last_name ?? "",
      age: observation.player?.birth_year ?? currentYear - 16,
      club_name: observation.player?.club?.name ?? "",
      competition: observation.competition ?? "",
      league: observation.league ?? "",
      home_team: observation.home_team ?? "",
      away_team: observation.away_team ?? "",
      match_date: observation.observation_date
        ? format(new Date(observation.observation_date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      match_result: observation.match_result ?? "",
      location: observation.location ?? "",
      notes: observation.notes ?? "",
      primary_position: primary,
      additional_positions: additional,
      technical_rating: observation.technical_rating ?? 3,
      speed_rating: observation.speed_rating ?? 3,
      motor_rating: observation.motor_rating ?? 3,
      motor_speed_rating: observation.motor_speed_rating ?? 3,
      motor_endurance_rating: observation.motor_endurance_rating ?? 3,
      motor_jump_rating: observation.motor_jump_rating ?? 3,
      motor_agility_rating: observation.motor_agility_rating ?? 3,
      motor_acceleration_rating: observation.motor_acceleration_rating ?? 3,
      motor_strength_rating: observation.motor_strength_rating ?? 3,
      tactical_rating: observation.tactical_rating ?? 3,
      mental_rating: observation.mental_rating ?? 3,
      potential_now: observation.potential_now ?? 3,
      potential_future: observation.potential_future ?? 3,
      overall_rating: observation.overall_rating ?? undefined,
      strengths: observation.strengths ?? "",
      weaknesses: observation.weaknesses ?? "",
      photo_url: observation.photo_url ?? "",
      rank: observation.rank ?? "B",
      source: observation.source ?? "live_match",
      form_type: observation.form_type === "extended" ? "senior" : observation.form_type === "simplified" ? "academy" : (observation.form_type ?? "academy"),
      summary: observation.summary ?? "",
      recommendation: observation.recommendation ?? undefined,
      match_performance_rating: observation.match_performance_rating ?? undefined,
      home_team_formation: matchObservation?.home_team_formation ?? "",
      away_team_formation: matchObservation?.away_team_formation ?? "",
    };
  }, [observation, matchObservation, currentYear]);

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
        lockPlayerFields={true}
        cancelHref={`/observations/${observationId}`}
        savedMedia={savedMedia}
        onRemoveSavedMedia={handleRemoveSavedMedia}
      />
    </div>
  );
}
