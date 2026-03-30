import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { MatchObservationHeaderForm, type MatchObservationHeaderFormRef } from "@/features/observations/components/MatchObservationHeaderForm";
import { fetchMatchObservationById, updateMatchObservation } from "@/features/observations/api/matchObservations.api";
import { fetchObservationsByMatchObservation } from "@/features/observations/api/observations.api";
import { useDeleteObservation } from "@/features/observations/hooks/useObservations";
import { formatPosition } from "@/features/players/positions";
import { toast } from "@/hooks/use-toast";

export function MatchObservationEditPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const headerFormRef = useRef<MatchObservationHeaderFormRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const deleteObservation = useDeleteObservation();

  const { data: match, isLoading } = useQuery({
    queryKey: ["match-observation", matchId],
    queryFn: () => fetchMatchObservationById(matchId!),
    enabled: Boolean(matchId),
  });

  const { data: observations = [] } = useQuery({
    queryKey: ["observations-by-match", matchId],
    queryFn: () => fetchObservationsByMatchObservation(matchId!),
    enabled: Boolean(matchId),
  });

  const initialValues = match
    ? {
        observation_date: format(new Date(match.observation_date), "yyyy-MM-dd"),
        competition: match.competition,
        league: match.league ?? "",
        home_team: match.home_team ?? "",
        away_team: match.away_team ?? "",
        match_result: match.match_result ?? "",
        source: (["live_match", "video_match", "video_clips", "tournament"] as const).includes(match.source as "live_match")
          ? (match.source as "live_match" | "video_match" | "video_clips" | "tournament")
          : match.context_type === "tournament"
            ? "tournament"
            : "live_match",
        home_team_formation: match.home_team_formation ?? "",
        away_team_formation: match.away_team_formation ?? "",
        match_notes: match.match_notes ?? "",
      }
    : undefined;

  const handleSave = async () => {
    const values = await headerFormRef.current?.validateAndGetValues?.();
    if (!values || !matchId) {
      toast({
        variant: "destructive",
        title: "Błąd w nagłówku",
        description: "Uzupełnij wymagane pola. Sprawdź komunikaty pod polami.",
      });
      return;
    }
    setIsSaving(true);
    try {
      await updateMatchObservation(matchId, {
        observation_date: values.observation_date,
        competition: values.competition,
        league: values.league?.trim() || null,
        home_team: values.home_team?.trim() || null,
        away_team: values.away_team?.trim() || null,
        match_result: values.match_result?.trim() || null,
        source: values.source,
        home_team_formation: values.home_team_formation?.trim() || null,
        away_team_formation: values.away_team_formation?.trim() || null,
        match_notes: values.match_notes?.trim() || null,
      });
      toast({ title: "Zapisano zmiany nagłówka." });
      navigate("/observations");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Nie udało się zapisać",
        description: e instanceof Error ? e.message : "Sprobuj ponownie.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteObservation = async (observationId: string) => {
    if (!window.confirm("Czy na pewno chcesz usunąć obserwację tego zawodnika z meczu?")) return;
    try {
      await deleteObservation.mutateAsync(observationId);
      await queryClient.invalidateQueries({ queryKey: ["observations-by-match", matchId] });
      toast({ title: "Obserwacja usunięta." });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się usunąć obserwacji.",
      });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ładowanie…</p>;
  }
  if (!match) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">Nie znaleziono obserwacji meczowej.</p>
        <Button asChild variant="outline">
          <Link to="/observations">Wróć do listy</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-6">
      <div className="flex justify-end">
        <Button asChild variant="outline" className="gap-2">
          <Link to="/observations">
            <ArrowLeft className="h-4 w-4" />
            Anuluj
          </Link>
        </Button>
      </div>
      <PageHeader title="Obserwacja meczowa" />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Nagłówek spotkania</h2>
        </CardHeader>
        <CardContent>
          <MatchObservationHeaderForm key={match.id} ref={headerFormRef} initialValues={initialValues} />
          <Button onClick={handleSave} disabled={isSaving} className="mt-4">
            {isSaving ? "Zapisywanie…" : "Zapisz zmiany"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold">Zawodnicy ({observations.length})</h2>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/observations/match/${matchId}/player/new`}>
              <Plus className="h-4 w-4" />
              Dodaj zawodnika
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {observations.length === 0 ? (
            <p className="text-sm text-slate-500">Brak dodanych zawodników. Kliknij „Dodaj zawodnika”, aby dodać pierwszą obserwację.</p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
              {observations.map((obs) => {
                const player = obs.player as { first_name?: string; last_name?: string; primary_position?: string } | undefined;
                const fullName = player
                  ? `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() || "Zawodnik"
                  : "Zawodnik";
                const positionCode = obs.positions?.[0] ?? player?.primary_position ?? null;
                const positionLabel = positionCode ? formatPosition(positionCode) : null;
                return (
                  <li
                    key={obs.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 hover:bg-slate-50 sm:flex-nowrap"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/observations/${obs.id}/edit`}
                        className="font-medium text-red-600 hover:underline"
                      >
                        {fullName}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0 text-sm text-slate-500">
                        {positionLabel && <span>{positionLabel}</span>}
                        {obs.overall_rating != null && (
                          <span>Ocena: {obs.overall_rating}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Edytuj obserwację">
                        <Link to={`/observations/${obs.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        title="Usuń obserwację"
                        disabled={deleteObservation.isPending}
                        onClick={() => handleDeleteObservation(obs.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
