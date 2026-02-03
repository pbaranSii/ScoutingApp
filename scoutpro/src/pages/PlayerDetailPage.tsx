import { Link, useParams } from "react-router-dom";
import { usePlayer } from "@/features/players/hooks/usePlayers";
import { PlayerProfile } from "@/features/players/components/PlayerProfile";
import { useDeleteObservation, useObservationsByPlayer } from "@/features/observations/hooks/useObservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

export function PlayerDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = usePlayer(id ?? "");
  const { data: observations = [], isLoading: isObsLoading } = useObservationsByPlayer(id ?? "");
  const { mutateAsync: deleteObservation, isPending: isDeleting } = useDeleteObservation();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Nie znaleziono zawodnika.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-6">
      <PlayerProfile player={data} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Obserwacje zawodnika</CardTitle>
          <Button asChild>
            <Link to={`/observations/new?playerId=${data.id}`}>Dodaj obserwacje</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isObsLoading && <p className="text-sm text-slate-500">Ladowanie...</p>}
          {!isObsLoading && observations.length === 0 && (
            <p className="text-sm text-slate-500">Brak obserwacji.</p>
          )}
          {!isObsLoading &&
            observations.map((observation) => {
              const dateLabel = observation.observation_date
                ? format(parseISO(observation.observation_date), "dd.MM.yyyy")
                : "-";
              return (
                <div
                  key={observation.id}
                  className="rounded-md border border-slate-200 px-3 py-2"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {dateLabel} • {observation.source}
                      </div>
                      <div className="text-xs text-slate-500">
                        Ranga: {observation.rank ?? "-"}
                      </div>
                      {observation.competition && (
                        <div className="text-xs text-slate-500">Rozgrywki: {observation.competition}</div>
                      )}
                      {observation.overall_rating && (
                        <div className="text-xs text-slate-500">Ocena: {observation.overall_rating}/10</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/observations/${observation.id}`}>Szczegoly</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link to={`/observations/${observation.id}/edit`}>Edytuj</Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={async () => {
                          const confirmed = window.confirm(
                            "Czy na pewno chcesz usunac obserwacje? Tej operacji nie mozna cofnac."
                          );
                          if (!confirmed) return;
                          try {
                            await deleteObservation(observation.id);
                          } catch (error) {
                            const message =
                              error instanceof Error && error.message
                                ? error.message
                                : "Nie udalo sie usunac obserwacji";
                            window.alert(message);
                            console.error("Delete observation failed:", error);
                          }
                        }}
                      >
                        Usun
                      </Button>
                    </div>
                  </div>
                  {observation.notes && (
                    <p className="mt-2 text-xs text-slate-600">{observation.notes}</p>
                  )}
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
