import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player } from "../types";
import { ALL_PIPELINE_STATUSES } from "@/features/pipeline/types";
import { mapLegacyPosition } from "@/features/players/positions";

const STATUS_STYLES: Record<string, string> = {
  unassigned: "border-slate-200 bg-slate-50 text-slate-600",
  observed: "border-slate-200 bg-slate-100 text-slate-700",
  shortlist: "border-blue-200 bg-blue-100 text-blue-700",
  trial: "border-amber-200 bg-amber-100 text-amber-700",
  offer: "border-orange-200 bg-orange-100 text-orange-700",
  signed: "border-emerald-200 bg-emerald-100 text-emerald-700",
  rejected: "border-red-200 bg-red-100 text-red-700",
};

const formatObservations = (count?: number | null) => {
  const value = typeof count === "number" ? count : 0;
  if (value === 1) return "1 obserwacja";
  if (value >= 2 && value <= 4) return `${value} obserwacje`;
  return `${value} obserwacji`;
};

type PlayerCardProps = {
  player: Player;
};

export function PlayerCard({ player }: PlayerCardProps) {
  const initials = `${player.first_name?.[0] ?? ""}${player.last_name?.[0] ?? ""}`.toUpperCase();
  const positionCode = player.primary_position ? mapLegacyPosition(player.primary_position) : "";
  const statusKey = player.pipeline_status ?? "unassigned";
  const statusLabel =
    ALL_PIPELINE_STATUSES.find((s) => s.id === statusKey)?.label ?? "Nieprzypisany";
  const statusStyle = STATUS_STYLES[statusKey] ?? STATUS_STYLES.unassigned;

  return (
    <Link to={`/players/${player.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white">
              {initials || "?"}
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-base font-semibold text-slate-900">
                {player.first_name} {player.last_name}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {positionCode && (
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                    {positionCode}
                  </Badge>
                )}
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                  {player.birth_year}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`rounded-full px-2 py-0.5 text-xs ${statusStyle}`}>
                  {statusLabel}
                </Badge>
                <span className="text-xs text-slate-500">
                  {formatObservations(player.observation_count)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
