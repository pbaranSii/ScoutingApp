import { useNavigate, useParams, Link } from "react-router-dom";
import { useDeleteObservation, useObservation } from "@/features/observations/hooks/useObservations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { formatPosition } from "@/features/players/positions";

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
  const currentYear = new Date().getFullYear();
  const ageLabel = observation.player?.birth_year
    ? `${currentYear - observation.player.birth_year} lat`
    : "-";
  const sourceLabels: Record<string, string> = {
    scouting: "Skauting",
    referral: "Polecenie",
    application: "Zgloszenie",
    trainer_report: "Raport trenera",
    scout_report: "Raport skauta",
  };
  const sourceLabel = observation.source ? sourceLabels[observation.source] ?? observation.source : "-";
  const positionLabel = formatPosition(observation.player?.primary_position ?? "");

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
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
        <CardContent className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase text-slate-400">Zawodnik</div>
            <div className="text-sm text-slate-700">
              {observation.player
                ? `${observation.player.first_name} ${observation.player.last_name}`.trim()
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Wiek</div>
            <div className="text-sm text-slate-700">{ageLabel}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Klub</div>
            <div className="text-sm text-slate-700">{observation.player?.club?.name ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Rozgrywki</div>
            <div className="text-sm text-slate-700">{observation.competition ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Data meczu</div>
            <div className="text-sm text-slate-700">{dateLabel}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Pozycja</div>
            <div className="text-sm text-slate-700">{positionLabel}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Ogolna ocena</div>
            <div className="text-sm text-slate-700">
              {observation.overall_rating ? `${observation.overall_rating}/10` : "-"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Ranga</div>
            <div className="text-sm text-slate-700">{observation.rank ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Zrodlo</div>
            <div className="text-sm text-slate-700">{sourceLabel}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Potencjal teraz</div>
            <div className="text-sm text-slate-700">{observation.potential_now ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Potencjal przyszly</div>
            <div className="text-sm text-slate-700">{observation.potential_future ?? "-"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs uppercase text-slate-400">Mocne strony</div>
            <div className="text-sm text-slate-700">{observation.strengths ?? "Brak"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs uppercase text-slate-400">Slabe strony</div>
            <div className="text-sm text-slate-700">{observation.weaknesses ?? "Brak"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs uppercase text-slate-400">Dodatkowe notatki</div>
            <div className="text-sm text-slate-700">{observation.notes ?? "Brak"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs uppercase text-slate-400">Zdjecie</div>
            {observation.photo_url ? (
              <a
                href={observation.photo_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                {observation.photo_url}
              </a>
            ) : (
              <div className="text-sm text-slate-700">Brak</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
