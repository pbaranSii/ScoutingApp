import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { format } from "date-fns";
import { useObservation } from "@/features/observations/hooks/useObservations";
import { ObservationWizard } from "@/features/observations/components/ObservationWizard";
import { mapLegacyPosition } from "@/features/players/positions";
import { useMultimediaByObservation, useDeleteMultimedia } from "@/features/multimedia";

export function EditObservationPage() {
  const { id } = useParams();
  const observationId = id ?? "";
  const { data: observation, isLoading } = useObservation(observationId);
  const { data: savedMedia = [] } = useMultimediaByObservation(observationId);
  const deleteMultimedia = useDeleteMultimedia(observation?.player_id ?? "");

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
      first_name: observation.player?.first_name ?? "",
      last_name: observation.player?.last_name ?? "",
      age: observation.player?.birth_year
        ? currentYear - observation.player.birth_year
        : 16,
      club_name: observation.player?.club?.name ?? "",
      competition: observation.competition ?? "",
      match_date: observation.observation_date
        ? format(new Date(observation.observation_date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      match_result: observation.match_result ?? "",
      location: observation.location ?? "",
      primary_position: primary,
      additional_positions: additional,
      technical_rating: observation.technical_rating ?? 3,
      speed_rating: observation.speed_rating ?? 3,
      motor_rating: observation.motor_rating ?? 3,
      tactical_rating: observation.tactical_rating ?? 3,
      mental_rating: observation.mental_rating ?? 3,
      potential_now: observation.potential_now ?? 3,
      potential_future: observation.potential_future ?? 3,
      overall_rating: observation.overall_rating ?? undefined,
      strengths: observation.strengths ?? "",
      strengths_notes: observation.strengths_notes ?? "",
      weaknesses: observation.weaknesses ?? "",
      weaknesses_notes: observation.weaknesses_notes ?? "",
      notes: observation.notes ?? "",
      photo_url: observation.photo_url ?? "",
      rank: observation.rank ?? "B",
      source: observation.source ?? "scouting",
    };
  }, [observation, currentYear]);

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
