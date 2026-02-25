import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import type { PlayerDemand } from "@/features/demands/types";
import {
  DEMAND_PRIORITY_LABELS,
  DEMAND_STATUS_LABELS,
  DEMAND_PREFERRED_FOOT_LABELS,
} from "@/features/demands/types";
import type { DemandPreferredFoot } from "@/features/demands/types";
import { formatPosition } from "@/features/players/positions";

type DemandPreviewCardProps = {
  demand: PlayerDemand;
  leagues?: { id: string; name: string }[];
};

export function DemandPreviewCard({ demand, leagues = [] }: DemandPreviewCardProps) {
  const clubName = demand.club?.name ?? "—";
  const positionLabel = formatPosition(demand.position);
  const leagueNames =
    demand.league_ids?.length && leagues.length
      ? demand.league_ids
          .map((id) => leagues.find((l) => l.id === id)?.name ?? id)
          .filter(Boolean)
      : [];
  const priorityLabel = DEMAND_PRIORITY_LABELS[demand.priority];
  const statusLabel = DEMAND_STATUS_LABELS[demand.status];
  const footLabel =
    demand.preferred_foot != null
      ? DEMAND_PREFERRED_FOOT_LABELS[demand.preferred_foot as DemandPreferredFoot]
      : null;
  const ageValue =
    demand.age_min != null || demand.age_max != null
      ? [demand.age_min, demand.age_max].filter((v) => v != null).join(" – ")
      : null;

  const rows: { label: string; value: string | number | null }[] = [
    { label: "Klub", value: clubName },
    { label: "Sezon", value: demand.season || null },
    { label: "Pozycja", value: positionLabel },
    { label: "Ligi", value: leagueNames.length > 0 ? leagueNames.join(", ") : null },
    { label: "Liczba poszukiwanych", value: demand.quantity_needed ?? null },
    { label: "Priorytet", value: priorityLabel },
    { label: "Status", value: statusLabel },
    { label: "Wiek", value: ageValue },
    { label: "Noga wiodąca", value: footLabel },
    { label: "Wymagania stylu gry", value: demand.style_notes?.trim() || null },
    { label: "Notatki", value: demand.notes?.trim() || null },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-slate-500" />
          Podgląd zapotrzebowania
        </CardTitle>
        <p className="text-xs text-slate-500">
          Pełne dane i wymagania zapotrzebowania – opis, kryteria oraz szczegóły.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
            <span className="min-w-[10rem] text-sm font-medium text-slate-600">{label}</span>
            <span className="text-sm text-slate-900">
              {value != null && value !== "" ? String(value) : "—"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
