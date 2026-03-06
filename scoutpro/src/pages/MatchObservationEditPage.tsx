import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft, Plus } from "lucide-react";
import { MatchObservationHeaderForm, type MatchObservationHeaderFormRef } from "@/features/observations/components/MatchObservationHeaderForm";
import { fetchMatchObservationById, updateMatchObservation } from "@/features/observations/api/matchObservations.api";
import { fetchObservationsByMatchObservation } from "@/features/observations/api/observations.api";
import { toast } from "@/hooks/use-toast";

export function MatchObservationEditPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const headerFormRef = useRef<MatchObservationHeaderFormRef>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        context_type: match.context_type as "match" | "tournament",
        observation_date: format(new Date(match.observation_date), "yyyy-MM-dd"),
        competition: match.competition,
        home_team: match.home_team ?? "",
        away_team: match.away_team ?? "",
        match_result: match.match_result ?? "",
        location: match.location ?? "",
        source: match.source,
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
        context_type: values.context_type,
        observation_date: values.observation_date,
        competition: values.competition,
        home_team: values.home_team?.trim() || null,
        away_team: values.away_team?.trim() || null,
        match_result: values.match_result?.trim() || null,
        location: values.location?.trim() || null,
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
          <ul className="space-y-2">
            {observations.map((obs) => (
              <li key={obs.id}>
                <Link
                  to={`/observations/${obs.id}/edit`}
                  className="text-red-600 hover:underline"
                >
                  {obs.player
                    ? `${(obs.player as { first_name?: string }).first_name} ${(obs.player as { last_name?: string }).last_name}`
                    : obs.id}
                </Link>
                {obs.overall_rating != null && (
                  <span className="ml-2 text-slate-500">· Ocena {obs.overall_rating}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
