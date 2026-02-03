import { useNavigate, useParams } from "react-router-dom";
import { usePlayer } from "@/features/players/hooks/usePlayers";
import { PlayerForm } from "@/features/players/components/PlayerForm";
import { Button } from "@/components/ui/button";

export function EditPlayerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const playerId = id ?? "";
  const { data: player, isLoading } = usePlayer(playerId);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!player) {
    return <p className="text-sm text-slate-500">Nie znaleziono zawodnika.</p>;
  }

  const initialValues = {
    first_name: player.first_name,
    last_name: player.last_name,
    birth_year: player.birth_year,
    nationality: player.nationality ?? "",
    club_name: player.club?.name ?? "",
    primary_position: player.primary_position ?? "",
    dominant_foot: player.dominant_foot ?? "",
    pipeline_status: player.pipeline_status ?? "observed",
    height_cm: player.height_cm ?? undefined,
    weight_kg: player.weight_kg ?? undefined,
    guardian_name: player.guardian_name ?? "",
    guardian_phone: player.guardian_phone ?? "",
    guardian_email: player.guardian_email ?? "",
    photo_url: player.photo_urls?.[0] ?? "",
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Edytuj zawodnika</h1>
          <p className="text-sm text-slate-600">
            Zmien dane zawodnika i zapisz aktualizacje.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => navigate(`/players/${player.id}`)}>
          Wroc do profilu
        </Button>
      </div>

      <PlayerForm
        mode="edit"
        playerId={player.id}
        initialValues={initialValues}
        onUpdated={() => navigate(`/players/${player.id}`)}
      />
    </div>
  );
}
