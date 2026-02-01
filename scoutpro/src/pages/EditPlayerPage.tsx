import { useNavigate, useParams } from "react-router-dom";
import { usePlayer } from "@/features/players/hooks/usePlayers";
import { PlayerForm } from "@/features/players/components/PlayerForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EditPlayerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const playerId = id ?? "";
  const { data: player, isLoading } = usePlayer(playerId);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!player) {
    return <p className="text-sm text-slate-500">Nie znaleziono zawodnika.</p>;
  }

  const initialValues = {
    first_name: player.first_name,
    last_name: player.last_name,
    birth_year: player.birth_year,
    club_name: player.club?.name ?? "",
    primary_position: player.primary_position ?? "",
    dominant_foot: player.dominant_foot ?? "",
    pipeline_status: player.pipeline_status ?? "observed",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Edytuj zawodnika</h1>
          <p className="text-sm text-slate-600">
            Zmien dane zawodnika i zapisz aktualizacje.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => navigate(`/players/${player.id}`)}>
          Wroc do profilu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dane zawodnika</CardTitle>
          <CardDescription>Wprowadz zmiany i kliknij zapisz.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerForm
            mode="edit"
            playerId={player.id}
            initialValues={initialValues}
            onUpdated={() => navigate(`/players/${player.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
