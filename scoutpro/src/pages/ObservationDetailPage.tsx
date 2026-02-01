import { useNavigate, useParams, Link } from "react-router-dom";
import { useDeleteObservation, useObservation } from "@/features/observations/hooks/useObservations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

export function ObservationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const observationId = id ?? "";
  const { data: observation, isLoading } = useObservation(observationId);
  const { mutateAsync: deleteObservation, isPending: isDeleting } = useDeleteObservation();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!observation) {
    return <p className="text-sm text-slate-500">Nie znaleziono obserwacji.</p>;
  }

  const dateLabel = observation.observation_date
    ? format(parseISO(observation.observation_date), "dd.MM.yyyy")
    : "-";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Szczegoly obserwacji</h1>
          <p className="text-sm text-slate-600">
            {observation.player?.last_name} {observation.player?.first_name} • {dateLabel}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={async () => {
              const confirmed = window.confirm(
                "Czy na pewno chcesz usunac obserwacje? Tej operacji nie mozna cofnac."
              );
              if (!confirmed) return;
              try {
                await deleteObservation(observation.id);
                navigate("/observations");
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
            {isDeleting ? "Usuwanie..." : "Usun obserwacje"}
          </Button>
          <Button asChild>
            <Link to={`/observations/${observation.id}/edit`}>Edytuj obserwacje</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dane obserwacji</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div>Data: {dateLabel}</div>
          <div>Ranga: {observation.rank ?? "-"}</div>
          <div>Zrodlo: {observation.source ?? "-"}</div>
          <div>Potencjal teraz: {observation.potential_now ?? "-"}</div>
          <div>Potencjal przyszly: {observation.potential_future ?? "-"}</div>
          <div className="sm:col-span-2">
            Komentarz: {observation.notes ?? "Brak"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
