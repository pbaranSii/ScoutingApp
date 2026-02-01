import { ObservationWizard } from "@/features/observations/components/ObservationWizard";
import { useSearchParams, Link } from "react-router-dom";
import { usePlayer } from "@/features/players/hooks/usePlayers";
import { Button } from "@/components/ui/button";

export function NewObservationPage() {
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId") ?? "";
  const { data: player, isLoading } = usePlayer(playerId);

  if (playerId && isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (playerId && !player) {
    return <p className="text-sm text-slate-500">Nie znaleziono zawodnika.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Nowa obserwacja</h1>
        {player && (
          <Button asChild variant="outline">
            <Link to={`/players/${player.id}`}>Wroc do zawodnika</Link>
          </Button>
        )}
      </div>
      <ObservationWizard
        prefillPlayer={
          player
            ? {
                id: player.id,
                first_name: player.first_name,
                last_name: player.last_name,
                birth_year: player.birth_year,
                club_name: player.club?.name ?? "",
                primary_position: player.primary_position ?? "",
                dominant_foot: player.dominant_foot ?? "",
              }
            : undefined
        }
        lockPlayerFields={Boolean(player)}
      />
    </div>
  );
}
