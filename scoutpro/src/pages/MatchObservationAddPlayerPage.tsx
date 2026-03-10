import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft } from "lucide-react";
import { MatchObservationPlayerForm } from "@/features/observations/components/MatchObservationPlayerForm";
import { fetchMatchObservationById } from "@/features/observations/api/matchObservations.api";
import { createObservation } from "@/features/observations/api/observations.api";
import { useCreatePlayer, useUpdatePlayer } from "@/features/players/hooks/usePlayers";
import { getClubIdByName } from "@/features/players/api/players.api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import type { ObservationInput } from "@/features/observations/types";
import type { MatchPlayerSlot } from "@/features/observations/types";

const auditName = (user: { user_metadata?: { full_name?: string }; email?: string } | null) =>
  (user?.user_metadata as { full_name?: string } | undefined)?.full_name ??
  user?.email ??
  "Użytkownik";
const auditRole = (user: { user_metadata?: { role?: string } } | null) =>
  (user?.user_metadata as { role?: string } | undefined)?.role ?? "user";

export function MatchObservationAddPlayerPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const createPlayerMut = useCreatePlayer();
  const updatePlayerMut = useUpdatePlayer();

  const { data: match, isLoading } = useQuery({
    queryKey: ["match-observation", matchId],
    queryFn: () => fetchMatchObservationById(matchId!),
    enabled: Boolean(matchId),
  });

  const handleSave = async (slot: Omit<MatchPlayerSlot, "id">) => {
    if (!matchId || !match || !user) {
      toast({ variant: "destructive", title: "Błąd", description: "Brak danych meczu lub użytkownika." });
      return;
    }
    try {
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
      } else {
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
      }

      const input: ObservationInput = {
        player_id: playerId,
        scout_id: user.id,
        source: match.source as ObservationInput["source"],
        observation_date: match.observation_date,
        match_observation_id: matchId,
        observation_category: "match_player",
        form_type: (slot.form_type ?? "academy") as ObservationInput["form_type"],
        match_performance_rating: slot.match_performance_rating,
        recommendation: slot.recommendation,
        summary: slot.summary.trim(),
        overall_rating: slot.form_type === "senior" ? null : slot.overall_rating,
        competition: match.competition?.trim() || null,
        positions: [slot.primary_position],
        strengths: slot.strengths?.trim() || null,
        weaknesses: slot.weaknesses?.trim() || null,
        potential_now: slot.form_type === "senior" ? null : (slot.potential_now ?? null),
        potential_future: slot.form_type === "senior" ? null : (slot.potential_future ?? null),
        technical_rating: slot.form_type === "senior" ? null : (slot.technical_rating ?? null),
        speed_rating: slot.form_type === "senior" ? null : (slot.speed_rating ?? null),
        motor_rating: slot.form_type === "senior" ? null : (slot.motor_rating ?? null),
        tactical_rating: slot.form_type === "senior" ? null : (slot.tactical_rating ?? null),
        mental_rating: slot.form_type === "senior" ? null : (slot.mental_rating ?? null),
        created_by: user.id,
        created_by_name: auditName(user),
        created_by_role: auditRole(user),
        updated_by: user.id,
        updated_by_name: auditName(user),
        updated_by_role: auditRole(user),
      };
      await createObservation(input);
      toast({ title: "Dodano zawodnika do obserwacji meczowej." });
      navigate(`/observations/match/${matchId}/edit`);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Nie udało się zapisać",
        description: e instanceof Error ? e.message : "Sprobuj ponownie.",
      });
    }
  };

  const handleCancel = () => {
    navigate(`/observations/match/${matchId}/edit`);
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

  const headerTeamNames = [match.home_team ?? "", match.away_team ?? ""].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <PageHeader
        title="Dodaj zawodnika"
        subtitle="Wypełnij formularz i zapisz – zawodnik zostanie dodany do tej obserwacji meczowej."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/observations/match/${matchId}/edit`}>
              <ArrowLeft className="h-4 w-4" />
              Anuluj
            </Link>
          </Button>
        }
      />
      <div className="h-px bg-slate-200" />
      <MatchObservationPlayerForm
        initialData={undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        headerTeamNames={headerTeamNames}
        competition={match.competition}
      />
    </div>
  );
}
