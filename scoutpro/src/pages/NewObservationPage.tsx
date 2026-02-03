import { ObservationWizard } from "@/features/observations/components/ObservationWizard";
import { useSearchParams, Link } from "react-router-dom";
import { usePlayer } from "@/features/players/hooks/usePlayers";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

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
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <PageHeader
        title="Nowa obserwacja"
        subtitle="Wypelnij wszystkie sekcje formularza"
        actions={
          <>
            <Button type="button" variant="destructive" className="gap-2">
              <Mic className="h-4 w-4" />
              Nagraj obserwacje
            </Button>
            {player && (
              <Button asChild variant="outline">
                <Link to={`/players/${player.id}`}>Wroc do zawodnika</Link>
              </Button>
            )}
          </>
        }
      />
      <div className="h-px bg-slate-200" />
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
              }
            : undefined
        }
        lockPlayerFields={Boolean(player)}
        cancelHref={player ? `/players/${player.id}` : "/observations"}
      />
    </div>
  );
}
