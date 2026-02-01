import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Observation } from "../types";
import { format, parseISO } from "date-fns";

type ObservationCardProps = {
  observation: Observation;
};

export function ObservationCard({ observation }: ObservationCardProps) {
  const player = observation.player;
  const dateLabel = observation.observation_date
    ? format(parseISO(observation.observation_date), "dd.MM.yyyy")
    : "-";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {player?.last_name} {player?.first_name}
            </div>
            <div className="text-xs text-slate-500">
              {player?.birth_year ?? "-"} • {dateLabel}
            </div>
          </div>
          {observation.rank && <Badge>{observation.rank}</Badge>}
        </div>
        {observation.notes && (
          <p className="mt-2 text-xs text-slate-600">
            {observation.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
