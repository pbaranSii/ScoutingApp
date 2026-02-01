import type { Player } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlayerProfileProps = {
  player: Player;
};

export function PlayerProfile({ player }: PlayerProfileProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {player.first_name} {player.last_name}
        </h1>
        <p className="text-sm text-slate-600">
          {player.birth_year} • {player.club?.name ?? "Brak klubu"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dane podstawowe</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div>Pozycja: {player.primary_position ?? "Brak"}</div>
          <div>Noga: {player.dominant_foot ?? "Brak"}</div>
          <div>Status: {player.pipeline_status ?? "observed"}</div>
        </CardContent>
      </Card>
    </div>
  );
}
