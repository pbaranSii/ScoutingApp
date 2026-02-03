import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import type { Player } from "../types";
import { formatPosition } from "@/features/players/positions";

type PlayerCardProps = {
  player: Player;
};

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Link to={`/players/${player.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {player.last_name} {player.first_name}
              </div>
              <div className="text-xs text-slate-500">
                {player.birth_year} • {player.club?.name ?? "Brak klubu"}
              </div>
            </div>
            {player.primary_position && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {formatPosition(player.primary_position)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
