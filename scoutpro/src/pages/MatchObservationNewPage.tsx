import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft, Plus } from "lucide-react";
import { MatchObservationHeaderForm, type MatchObservationHeaderFormRef } from "@/features/observations/components/MatchObservationHeaderForm";
import { createMatchObservation } from "@/features/observations/api/matchObservations.api";
import { createObservation } from "@/features/observations/api/observations.api";
import { useCreatePlayer, useUpdatePlayer } from "@/features/players/hooks/usePlayers";
import { getClubIdByName } from "@/features/players/api/players.api";
import { useAuthStore } from "@/stores/authStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSync } from "@/features/offline/hooks/useSync";
import { toast } from "@/hooks/use-toast";
import { MatchObservationPlayerCard } from "@/features/observations/components/MatchObservationPlayerCard";
import { useMatchObservationNew } from "@/pages/MatchObservationNewLayout";
import type { ObservationInput } from "@/features/observations/types";

function nextId() {
  return crypto.randomUUID();
}

const auditName = (user: { user_metadata?: { full_name?: string }; email?: string } | null) =>
  (user?.user_metadata as { full_name?: string } | undefined)?.full_name ??
  user?.email ??
  "Użytkownik";
const auditRole = (user: { user_metadata?: { role?: string } } | null) =>
  (user?.user_metadata as { role?: string } | undefined)?.role ?? "user";

export function MatchObservationNewPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const { addOfflineMatchObservation } = useSync();
  const { players, setPlayers, headerTeamNames, setHeaderTeamNames, headerFormValues, setHeaderFormValues } = useMatchObservationNew();
  const headerFormRef = useRef<MatchObservationHeaderFormRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const createPlayerMut = useCreatePlayer();
  const updatePlayerMut = useUpdatePlayer();

  const handleAddPlayer = () => {
    navigate("/observations/match/new/player");
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setPlayerToRemove(null);
  };

  const handleConfirmRemove = () => {
    if (playerToRemove) handleRemovePlayer(playerToRemove);
  };

  const handleSaveMatchObservation = async () => {
    const headerValues = await headerFormRef.current?.validateAndGetValues?.();
    if (!headerValues) {
      toast({
        variant: "destructive",
        title: "Błąd w nagłówku",
        description: "Uzupełnij wymagane pola w nagłówku spotkania. Sprawdź komunikaty pod polami.",
      });
      return;
    }
    if (players.length === 0) {
      toast({
        variant: "destructive",
        title: "Brak zawodników",
        description: "Dodaj co najmniej jednego wyróżniającego się zawodnika.",
      });
      return;
    }
    const invalid = players.find(
      (p) =>
        !(p.first_name?.trim() && p.last_name?.trim() && p.primary_position && p.summary?.trim().length >= 10)
    );
    if (invalid) {
      const name = [invalid.first_name, invalid.last_name].filter(Boolean).join(" ") || "Wyróżniony zawodnik";
      toast({
        variant: "destructive",
        title: "Uzupełnij dane zawodnika",
        description: `${name}: uzupełnij imię, nazwisko, pozycję główną i podsumowanie (min. 10 znaków).`,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (!isOnline) {
        const localId = nextId();
        await addOfflineMatchObservation({
          localId,
          matchHeader: {
            observation_date: headerValues.observation_date,
            competition: headerValues.competition ?? "",
            league: headerValues.league?.trim() || null,
            home_team: headerValues.home_team?.trim() || null,
            away_team: headerValues.away_team?.trim() || null,
            match_result: headerValues.match_result?.trim() || null,
            source: headerValues.source,
            scout_id: user!.id,
            home_team_formation: headerValues.home_team_formation?.trim() || null,
            away_team_formation: headerValues.away_team_formation?.trim() || null,
            match_notes: headerValues.match_notes?.trim() || null,
            created_by: user!.id,
            created_by_name: auditName(user),
            created_by_role: auditRole(user),
          },
          slots: players.map((p) => ({
            player_id: p.player_id,
            first_name: p.first_name.trim(),
            last_name: p.last_name.trim(),
            birth_year: p.birth_year,
            birth_date: p.birth_date ?? undefined,
            club_name: p.club_name,
            primary_position: p.primary_position,
            overall_rating: p.overall_rating,
            match_performance_rating: p.match_performance_rating,
            recommendation: p.recommendation,
            summary: p.summary.trim(),
            strengths: p.strengths,
            weaknesses: p.weaknesses,
            potential_now: p.potential_now,
            potential_future: p.potential_future,
            technical_rating: p.technical_rating,
            speed_rating: p.speed_rating,
            motor_rating: p.motor_rating,
            tactical_rating: p.tactical_rating,
            mental_rating: p.mental_rating,
          })),
          createdAt: new Date(),
          syncStatus: "pending",
          syncAttempts: 0,
        });
        toast({
          title: "Zapisano offline",
          description: "Obserwacja meczowa zostanie zsynchronizowana po powrocie połączenia.",
        });
        navigate("/observations");
        return;
      }

      const matchObs = await createMatchObservation({
        observation_date: headerValues.observation_date,
        competition: headerValues.competition ?? "",
        league: headerValues.league?.trim() || null,
        home_team: headerValues.home_team?.trim() || null,
        away_team: headerValues.away_team?.trim() || null,
        match_result: headerValues.match_result?.trim() || null,
        source: headerValues.source,
        scout_id: user!.id,
        home_team_formation: headerValues.home_team_formation?.trim() || null,
        away_team_formation: headerValues.away_team_formation?.trim() || null,
        match_notes: headerValues.match_notes?.trim() || null,
      });

      for (const slot of players) {
        const clubId = await getClubIdByName(slot.club_name?.trim());
        let playerId = slot.player_id;
        if (!playerId) {
          const created = await createPlayerMut.mutateAsync({
            first_name: slot.first_name.trim(),
            last_name: slot.last_name.trim(),
            birth_year: slot.birth_year,
            birth_date: slot.birth_date?.trim() || null,
            primary_position: slot.primary_position,
            club_id: clubId ?? undefined,
            pipeline_status: "unassigned",
          });
          playerId = created.id;
        }

        await updatePlayerMut.mutateAsync({
          id: playerId,
          input: {
            first_name: slot.first_name.trim(),
            last_name: slot.last_name.trim(),
            birth_year: slot.birth_year,
            birth_date: slot.birth_date?.trim() || null,
            primary_position: slot.primary_position,
            club_id: clubId ?? null,
          },
        });

        const formType = slot.form_type ?? "academy";
        const input: ObservationInput = {
          player_id: playerId,
          scout_id: user!.id,
          source: headerValues.source as ObservationInput["source"],
          observation_date: headerValues.observation_date,
          match_observation_id: matchObs.id,
          observation_category: "match_player",
          form_type: formType as ObservationInput["form_type"],
          match_performance_rating: slot.match_performance_rating,
          recommendation: slot.recommendation,
          summary: slot.summary.trim(),
          overall_rating: formType === "senior" ? null : slot.overall_rating,
          competition: headerValues.competition?.trim() || null,
          positions: [slot.primary_position],
          strengths: slot.strengths?.trim() || null,
          weaknesses: slot.weaknesses?.trim() || null,
          potential_now: formType === "senior" ? null : (slot.potential_now ?? null),
          potential_future: formType === "senior" ? null : (slot.potential_future ?? null),
          technical_rating: formType === "senior" ? null : (slot.technical_rating ?? null),
          speed_rating: formType === "senior" ? null : (slot.speed_rating ?? null),
          motor_rating: formType === "senior" ? null : (slot.motor_rating ?? null),
          tactical_rating: formType === "senior" ? null : (slot.tactical_rating ?? null),
          mental_rating: formType === "senior" ? null : (slot.mental_rating ?? null),
          created_by: user!.id,
          created_by_name: auditName(user),
          created_by_role: auditRole(user),
          updated_by: user!.id,
          updated_by_name: auditName(user),
          updated_by_role: auditRole(user),
        };
        await createObservation(input);
      }

      toast({
        title: "Zapisano obserwację meczową",
        description: `Nagłówek i ${players.length} zawodników.`,
      });
      navigate("/observations");
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Nie udało się zapisać",
        description: e instanceof Error ? e.message : "Sprobuj ponownie.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-6 pb-24 lg:pb-0">
      <PageHeader
        title="Obserwacja meczowa"
        subtitle="Nagłówek spotkania i wyróżniający się zawodnicy"
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link to="/observations">
              <ArrowLeft className="h-4 w-4" />
              Anuluj
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Nagłówek spotkania</h2>
        </CardHeader>
        <CardContent>
          <MatchObservationHeaderForm
            ref={headerFormRef}
            initialValues={headerFormValues ?? undefined}
            onValuesChange={(vals) => {
              setHeaderFormValues(vals);
              setHeaderTeamNames(vals.home_team ?? "", vals.away_team ?? "");
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold">Wyróżniający się zawodnicy</h2>
          <Button type="button" onClick={handleAddPlayer} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj zawodnika
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {players.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
              Kliknij „Dodaj zawodnika”, aby dodać kartę z formularzem obserwacji (uproszczony).
            </p>
          )}
          {players.map((slot) => (
            <MatchObservationPlayerCard
              key={slot.id}
              slot={slot}
              isExpanded={false}
              onEdit={() => navigate(`/observations/match/new/player/${slot.id}`)}
              onRemove={() => setPlayerToRemove(slot.id)}
              headerTeamNames={headerTeamNames.filter(Boolean)}
              listView
            />
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Usuń zawodnika z listy</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć tego zawodnika z listy wyróżniających się? Dane nie zostaną zapisane w obserwacji.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPlayerToRemove(null)}>
              Anuluj
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmRemove}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end max-lg:hidden">
        <Button
          onClick={handleSaveMatchObservation}
          disabled={isSaving || players.length === 0}
          className="gap-2"
        >
          {isSaving ? "Zapisywanie…" : "Zapisz obserwację meczową"}
        </Button>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 lg:hidden">
        <Button
          type="button"
          className="w-full"
          disabled={isSaving || players.length === 0}
          onClick={handleSaveMatchObservation}
        >
          {isSaving ? "Zapisywanie…" : "Zapisz obserwację meczową"}
        </Button>
      </div>
    </div>
  );
}
