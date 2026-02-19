import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player } from "../types";
import { ALL_PIPELINE_STATUSES, getStatusBadgeClass } from "@/features/pipeline/types";
import { formatPosition } from "@/features/players/positions";
import { AddToFavoritesButton } from "@/features/favorites/components/AddToFavoritesButton";
import { Calendar, MapPin } from "lucide-react";

const formatObservations = (count?: number | null) => {
  const value = typeof count === "number" ? count : 0;
  if (value === 1) return "1 obserwacja";
  if (value >= 2 && value <= 4) return `${value} obserwacje`;
  return `${value} obserwacji`;
};

/** Map overall_rating 1-10 to 1-5 stars (filled count). */
function ratingToStars(rating: number): number {
  return Math.round((rating / 10) * 5);
}

type PlayerCardProps = {
  player: Player;
  latestRating?: number | null;
};

export function PlayerCard({ player, latestRating }: PlayerCardProps) {
  const initials = `${player.first_name?.[0] ?? ""}${player.last_name?.[0] ?? ""}`.toUpperCase();
  const statusKey = player.pipeline_status ?? "unassigned";
  const statusLabel =
    ALL_PIPELINE_STATUSES.find((s) => s.id === statusKey)?.label ?? "Nieprzypisany";
  const statusStyle = getStatusBadgeClass(statusKey);
  const positionLabel = formatPosition(player.primary_position);
  const clubName = player.club?.name ?? "—";
  const stars = latestRating != null ? ratingToStars(latestRating) : null;

  return (
    <Link to={`/players/${player.id}`} className="block relative">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="relative p-0">
          {/* Upper section with background - initials centered */}
          <div className="relative flex min-h-[5rem] flex-col bg-slate-50 px-4 pb-4 pt-4">
            <div
              className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-5xl font-bold text-slate-200"
              aria-hidden
            >
              {initials || "?"}
            </div>
            {/* Top row: status left, heart right */}
            <div className="relative flex w-full items-start justify-between gap-2">
              <Badge className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusStyle}`}>
                {statusLabel}
              </Badge>
              <div onClick={(e) => e.preventDefault()}>
                <AddToFavoritesButton
                  playerId={player.id}
                  playerName={`${player.first_name} ${player.last_name}`}
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                />
              </div>
            </div>
          </div>

          {/* Middle section: name, position, club, birth year */}
          <div className="relative space-y-2 px-4 py-3">
            <div className="text-base font-semibold text-slate-900">
              {player.first_name} {player.last_name}
            </div>
            {positionLabel !== "-" && (
              <div className="text-sm text-slate-600">{positionLabel}</div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {clubName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {player.birth_year}
              </span>
            </div>
          </div>

          {/* Bottom section: stars left, observation count right */}
          <div className="relative flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
            <span
              className="text-lg text-amber-500"
              aria-label={stars != null ? `${stars} z 5 gwiazdek` : undefined}
            >
              {stars != null
                ? "★".repeat(stars) + "☆".repeat(5 - stars)
                : "☆".repeat(5)}
            </span>
            <span className="text-xs text-slate-500">
              {formatObservations(player.observation_count)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
