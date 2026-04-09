import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player } from "../types";
import { ALL_PIPELINE_STATUSES, getStatusBadgeClass } from "@/features/pipeline/types";
import { formatPosition } from "@/features/players/positions";
import { AddToFavoritesButton } from "@/features/favorites/components/AddToFavoritesButton";
import { AssignToDemandButton } from "@/features/demands/components/AssignToDemandButton";
import { Calendar, MapPin } from "lucide-react";

type PlayerRowCardProps = {
  player: Player;
  latestRating?: number | null;
};

export function PlayerRowCard({ player, latestRating: _latestRating }: PlayerRowCardProps) {
  const statusKey = player.pipeline_status ?? "unassigned";
  const statusLabel =
    ALL_PIPELINE_STATUSES.find((s) => s.id === statusKey)?.label ?? "Nieprzypisany";
  const statusStyle = getStatusBadgeClass(statusKey);
  const positionLabel = formatPosition(player.primary_position);
  const clubName = player.club?.name ?? "—";
  const fullName = `${player.first_name} ${player.last_name}`.trim();

  return (
    <Link to={`/players/${player.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-base font-semibold text-slate-900">{fullName}</div>
                <Badge className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusStyle}`}>
                  {statusLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                {positionLabel !== "-" && <span>{positionLabel}</span>}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {clubName}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {player.birth_year}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">—</span>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                <AssignToDemandButton
                  playerId={player.id}
                  playerName={fullName}
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                />
                <AddToFavoritesButton
                  playerId={player.id}
                  playerName={fullName}
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

