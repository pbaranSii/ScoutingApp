import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Observation } from "../types";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { ImageIcon, Star } from "lucide-react";
import { formatPosition } from "@/features/players/positions";

type ObservationCardProps = {
  observation: Observation;
};

export function ObservationCard({ observation }: ObservationCardProps) {
  const player = observation.player;
  const dateLabel = observation.observation_date
    ? format(parseISO(observation.observation_date), "dd.MM.yyyy")
    : "-";
  const currentYear = new Date().getFullYear();
  const ageLabel = player?.birth_year ? `${currentYear - player.birth_year} lat` : "-";
  const positionLabel = formatPosition(player?.primary_position ?? "");
  const rating = observation.overall_rating;
  const ratingClass =
    typeof rating === "number" && rating >= 8
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : typeof rating === "number" && rating >= 6
        ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
        : "bg-slate-100 text-slate-700 hover:bg-slate-100";
  const hasMedia = Boolean(observation.photo_url?.trim());

  return (
    <Link to={`/observations/${observation.id}`} className="block">
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-slate-900">
                  {player?.first_name} {player?.last_name}
                </div>
                <Badge className="w-fit justify-center rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                  {ageLabel}
                </Badge>
                {player?.primary_position && (
                  <Badge className="w-fit justify-center rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                    {positionLabel}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-slate-600">
                {(player?.club?.name ?? "Brak klubu") +
                  (observation.competition ? ` • ${observation.competition}` : "")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasMedia && (
                <span
                  className="flex items-center rounded-full bg-slate-100 p-1.5 text-slate-500"
                  title="Obserwacja ma multimedia"
                  aria-label="Obserwacja ma multimedia"
                >
                  <ImageIcon className="h-4 w-4" />
                </span>
              )}
              {typeof rating === "number" && (
                <Badge className={`flex items-center gap-1 rounded-full px-2 ${ratingClass}`}>
                  <Star className="h-3.5 w-3.5" />
                  {rating}
                </Badge>
              )}
            </div>
          </div>
          {observation.notes && (
            <p className="mt-3 text-sm text-slate-600">{observation.notes}</p>
          )}
          <div className="mt-3 text-xs text-slate-500">{dateLabel}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
