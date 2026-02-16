import { Component, type ReactNode } from "react";
import { ObservationWizard } from "@/features/observations/components/ObservationWizard";
import { useSearchParams, Link } from "react-router-dom";
import { usePlayer } from "@/features/players/hooks/usePlayers";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

class ObservationWizardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Błąd ładowania formularza</p>
          <p className="mt-1">{this.state.error.message}</p>
          <p className="mt-2 text-xs">Sprawdź konsolę przeglądarki (F12) po szczegóły.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <div className="mx-auto w-full max-w-[960px] space-y-4 min-h-[400px]">
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
      <ObservationWizardErrorBoundary>
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
      </ObservationWizardErrorBoundary>
    </div>
  );
}
