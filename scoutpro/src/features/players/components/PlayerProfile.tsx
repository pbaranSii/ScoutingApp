import { useNavigate, Link } from "react-router-dom";
import type { Player } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeletePlayer } from "../hooks/usePlayers";
import { PIPELINE_COLUMNS } from "@/features/pipeline/types";
import { formatPosition } from "@/features/players/positions";

type PlayerProfileProps = {
  player: Player;
};

export function PlayerProfile({ player }: PlayerProfileProps) {
  const navigate = useNavigate();
  const { mutateAsync: deletePlayer, isPending: isDeleting } = useDeletePlayer();
  const statusLabel =
    PIPELINE_COLUMNS.find((column) => column.id === (player.pipeline_status ?? "observed"))
      ?.label ?? "Obserwowany";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {player.first_name} {player.last_name}
          </h1>
          <p className="text-sm text-slate-600">
            {player.birth_year} • {player.club?.name ?? "Brak klubu"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={async () => {
              const confirmed = window.confirm(
                "Czy na pewno chcesz usunac zawodnika? Tej operacji nie mozna cofnac."
              );
              if (!confirmed) return;
              try {
                await deletePlayer(player.id);
                navigate("/players");
              } catch (error) {
                const message =
                  error instanceof Error && error.message
                    ? error.message
                    : "Nie udalo sie usunac zawodnika";
                window.alert(message);
                console.error("Delete player failed:", error);
              }
            }}
          >
            {isDeleting ? "Usuwanie..." : "Usun zawodnika"}
          </Button>
          <Button asChild>
            <Link to={`/players/${player.id}/edit`}>Edytuj zawodnika</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6">
          <CardTitle className="text-base">Dane podstawowe</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 px-6 text-sm text-slate-600 sm:grid-cols-2">
          <div>Pozycja: {formatPosition(player.primary_position)}</div>
          <div>Noga: {player.dominant_foot ?? "Brak"}</div>
          <div>Status: {statusLabel}</div>
        </CardContent>
      </Card>
    </div>
  );
}
