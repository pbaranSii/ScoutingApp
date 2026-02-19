import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useDeleteObservation, useObservation } from "@/features/observations/hooks/useObservations";
import {
  fetchPlayerEvaluationsByObservation,
  fetchEvaluationCriteriaByPositionCode,
} from "@/features/observations/api/evaluationCriteria.api";
import { usePlayerSources } from "@/features/dictionaries/hooks/useDictionaries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { formatPosition } from "@/features/players/positions";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Plus, Star, Trash2, User } from "lucide-react";
import { ALL_PIPELINE_STATUSES } from "@/features/pipeline/types";
import { toast } from "@/hooks/use-toast";
import { MediaGallery, useMultimediaByObservation } from "@/features/multimedia";
import { MULTIMEDIA_TABLE_MISSING_CODE } from "@/features/multimedia/api/multimedia.api";
import { buildLegacyMediaItemsForObservation } from "@/features/multimedia/lib/legacyMedia";
import { mapLegacyPosition } from "@/features/players/positions";
import { AddToFavoritesButton } from "@/features/favorites/components/AddToFavoritesButton";

export function ObservationDetailPage() {
  const { id } = useParams();
  const observationId = id ?? "";
  const navigate = useNavigate();
  const location = useLocation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: observation, isLoading } = useObservation(observationId);
  const { data: playerSources = [] } = usePlayerSources();
  const primaryPositionCode =
    observation?.positions?.[0] != null
      ? mapLegacyPosition(observation.positions[0])
      : observation?.player?.primary_position
        ? mapLegacyPosition(observation.player.primary_position)
        : "";
  const { data: positionCriteria = [] } = useQuery({
    queryKey: ["evaluation-criteria", primaryPositionCode],
    queryFn: () => fetchEvaluationCriteriaByPositionCode(primaryPositionCode),
    enabled: Boolean(primaryPositionCode) && Boolean(observationId),
  });
  const { data: positionEvaluations = [] } = useQuery({
    queryKey: ["player-evaluations", observationId],
    queryFn: () => fetchPlayerEvaluationsByObservation(observationId),
    enabled: Boolean(observationId),
  });
  const criteriaById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of positionCriteria) {
      m[c.id] = c.name;
    }
    return m;
  }, [positionCriteria]);
  const { data: savedMedia = [], isError: isMultimediaError, error: multimediaError } = useMultimediaByObservation(observationId);
  const multimediaTableMissing =
    isMultimediaError &&
    multimediaError instanceof Error &&
    (multimediaError as Error & { code?: string }).code === MULTIMEDIA_TABLE_MISSING_CODE;
  const legacyMedia = useMemo(
    () => (observation ? buildLegacyMediaItemsForObservation(observation) : []),
    [observation]
  );
  const observationMedia = useMemo(
    () => [...(savedMedia ?? []), ...legacyMedia],
    [savedMedia, legacyMedia]
  );
  const deleteObservation = useDeleteObservation();
  const canUseDom = typeof document !== "undefined";

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!observation) {
    return <p className="text-sm text-slate-500">Nie znaleziono obserwacji.</p>;
  }

  const dateLabel = observation.observation_date
    ? format(parseISO(observation.observation_date), "dd.MM.yyyy")
    : "—";
  const currentYear = new Date().getFullYear();
  const ageLabel = observation.player?.birth_year
    ? `${currentYear - observation.player.birth_year} lat`
    : "—";
  const positionLabel = formatPosition(observation.player?.primary_position ?? "");
  const statusLabel =
    ALL_PIPELINE_STATUSES.find((column) => column.id === (observation.player?.pipeline_status ?? "unassigned"))
      ?.label ?? "Nieprzypisany";
  const sourceLabel =
    (playerSources as { source_code?: string; name_pl?: string }[]).find(
      (s) => s.source_code === observation.source
    )?.name_pl ?? observation.source ?? "—";
  const rating = observation.overall_rating;
  const ratingClass =
    typeof rating === "number" && rating >= 8
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : typeof rating === "number" && rating >= 6
        ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
        : "bg-slate-100 text-slate-700 hover:bg-slate-100";
  const createdAtLabel = observation.created_at
    ? format(parseISO(observation.created_at), "dd.MM.yyyy, HH:mm")
    : "-";
  const updatedAtLabel = observation.updated_at
    ? format(parseISO(observation.updated_at), "dd.MM.yyyy, HH:mm")
    : "-";
  const createdByLabel = observation.created_by_name ?? "Brak";
  const updatedByLabel = observation.updated_by_name ?? "Brak";
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    user: "Uzytkownik",
  };
  const createdByRole = observation.created_by_role
    ? roleLabels[observation.created_by_role] ?? observation.created_by_role
    : "-";
  const updatedByRole = observation.updated_by_role
    ? roleLabels[observation.updated_by_role] ?? observation.updated_by_role
    : "-";

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/observations" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Link>
        <div className="flex flex-wrap gap-2">
          {observation.player_id && (
            <AddToFavoritesButton
              playerId={observation.player_id}
              playerName={
                observation.player
                  ? `${observation.player.first_name ?? ""} ${observation.player.last_name ?? ""}`.trim() || "Zawodnik"
                  : "Zawodnik"
              }
              variant="outline"
              size="default"
              className="gap-2"
            />
          )}
          <Button asChild variant="outline" className="gap-2">
            <Link
              to={`/observations/${observation.id}/edit`}
              state={{ from: `${location.pathname}${location.search}` }}
            >
              <Pencil className="h-4 w-4" />
              Edytuj
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => {
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Usuń
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/observations/new?playerId=${observation.player_id}`}>
              <Plus className="h-4 w-4" />
              Nowa obserwacja dla tego zawodnika
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/players/${observation.player_id}`}>
              <User className="h-4 w-4" />
              Profil zawodnika
            </Link>
          </Button>
        </div>
      </div>

      {canUseDom &&
        isDeleteOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteOpen(false);
              }}
            />
            <div
              className="relative z-[81] w-[min(520px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">Usun obserwacje?</h2>
                <p className="text-sm text-slate-600">
                  Ta operacja jest nieodwracalna. Obserwacja zostanie trwale usunieta z bazy.
                </p>
              </div>
              {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteError(null);
                    setIsDeleteOpen(false);
                  }}
                  disabled={deleteObservation.isPending}
                >
                  Anuluj
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setDeleteError(null);
                    try {
                      await deleteObservation.mutateAsync(observation.id);
                      toast({
                        title: "Usunieto obserwacje",
                        description: "Obserwacja zostala trwale usunieta.",
                      });
                      setIsDeleteOpen(false);
                      navigate("/observations");
                    } catch (error) {
                      const message =
                        error instanceof Error && error.message
                          ? error.message
                          : "Nie udalo sie usunac obserwacji";
                      setDeleteError(message);
                      toast({
                        variant: "destructive",
                        title: "Nie udalo sie usunac",
                        description: message,
                      });
                      console.error("Delete observation failed:", error);
                    }
                  }}
                  disabled={deleteObservation.isPending}
                >
                  Usuń
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-2xl font-semibold text-slate-900">
            {observation.player
              ? `${observation.player.first_name} ${observation.player.last_name}`.trim()
              : "Szczegoly obserwacji"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
              {ageLabel}
            </Badge>
            {observation.player?.primary_position && (
              <Badge className="rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                {positionLabel}
              </Badge>
            )}
          </div>
        </div>
        {typeof rating === "number" && (
          <Badge className={`flex items-center gap-1 rounded-full px-2 ${ratingClass}`}>
            <Star className="h-3.5 w-3.5" />
            {rating}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">1. Dane zawodnika</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            <div>
              <span className="font-medium text-slate-700">Imię: </span>
              <span className="text-slate-600">{observation.player?.first_name ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Nazwisko: </span>
              <span className="text-slate-600">{observation.player?.last_name ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Rok urodzenia: </span>
              <span className="text-slate-600">{observation.player?.birth_year ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Klub: </span>
              <span className="text-slate-600">{observation.player?.club?.name ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Pozycja główna: </span>
              <span className="text-slate-600">{positionLabel}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Status pipeline: </span>
              <span className="text-slate-600">{statusLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">2. Dane obserwacji</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            <div>
              <span className="font-medium text-slate-700">Rozgrywki: </span>
              <span className="text-slate-600">{observation.competition?.trim() || "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Data meczu: </span>
              <span className="text-slate-600">{dateLabel}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Wynik meczu: </span>
              <span className="text-slate-600">{observation.match_result?.trim() || "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Lokalizacja: </span>
              <span className="text-slate-600">{observation.location?.trim() || "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Źródło: </span>
              <span className="text-slate-600">{sourceLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">3. Pozycje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-slate-700">Pozycja główna: </span>
            <span className="text-slate-600">
              {observation.positions?.[0] ? formatPosition(observation.positions[0]) : positionLabel}
            </span>
          </div>
          {observation.positions && observation.positions.length > 1 && (
            <div className="flex flex-wrap gap-1">
              <span className="font-medium text-slate-700">Dodatkowe: </span>
              {observation.positions.slice(1).map((p) => (
                <Badge key={p} variant="secondary" className="rounded-full">
                  {formatPosition(p)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">4. Oceny ogólne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            <div>
              <span className="font-medium text-slate-700">Technika: </span>
              <span className="text-slate-600">{observation.technical_rating ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Szybkość: </span>
              <span className="text-slate-600">{observation.speed_rating ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Motoryka: </span>
              <span className="text-slate-600">{observation.motor_rating ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Taktyka: </span>
              <span className="text-slate-600">{observation.tactical_rating ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Mentalność: </span>
              <span className="text-slate-600">{observation.mental_rating ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Potencjał teraz: </span>
              <span className="text-slate-600">{observation.potential_now ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Potencjał przyszły: </span>
              <span className="text-slate-600">{observation.potential_future ?? "—"}</span>
            </div>
          </div>
          {typeof observation.overall_rating === "number" && (
            <div className="mt-2">
              <span className="font-medium text-slate-700">Ogólna ocena (1–10): </span>
              <Badge className={`ml-1 ${ratingClass}`}>{observation.overall_rating}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {positionEvaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              5. Oceny specyficzne dla pozycji
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {positionEvaluations.map(({ criteria_id, score }) => (
                <li key={criteria_id} className="flex justify-between gap-2">
                  <span className="font-medium text-slate-700">
                    {criteriaById[criteria_id] ?? criteria_id}
                  </span>
                  <span className="text-slate-600">{score}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">6. Analiza i notatki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <span className="font-medium text-slate-700">Ranga: </span>
            <span className="text-slate-600">{observation.rank ?? "—"}</span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Mocne strony: </span>
            <span className="text-slate-600">{observation.strengths?.trim() || "Brak"}</span>
            {observation.strengths_notes && (
              <div className="mt-1 rounded bg-slate-50 p-2 text-slate-600">
                {observation.strengths_notes}
              </div>
            )}
          </div>
          <div>
            <span className="font-medium text-slate-700">Słabe strony: </span>
            <span className="text-slate-600">{observation.weaknesses?.trim() || "Brak"}</span>
            {observation.weaknesses_notes && (
              <div className="mt-1 rounded bg-slate-50 p-2 text-slate-600">
                {observation.weaknesses_notes}
              </div>
            )}
          </div>
          <div>
            <span className="font-medium text-slate-700">Dodatkowe notatki: </span>
            <span className="text-slate-600">{observation.notes?.trim() || "Brak"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Multimedia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {multimediaTableMissing && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Multimedia nie są jeszcze skonfigurowane na bazie. Poniżej wyświetlane są zapisane wcześniej linki (np. zdjęcie z obserwacji).
            </p>
          )}
          <MediaGallery
            items={observationMedia}
            emptyMessage="Brak multimediów do tej obserwacji."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadane</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div>
            Utworzono: {createdAtLabel} • {createdByLabel} • {createdByRole}
          </div>
          <div>
            Ostatnia edycja: {updatedAtLabel} • {updatedByLabel} • {updatedByRole}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
