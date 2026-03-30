import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlayerDemand } from "../types";
import { DEMAND_PRIORITY_LABELS, DEMAND_STATUS_LABELS } from "../types";
import { formatPosition } from "@/features/players/positions";
import { Target, Pencil, Trash2 } from "lucide-react";

type DemandCardProps = {
  demand: PlayerDemand;
  canManage?: boolean;
  onDelete?: (demand: PlayerDemand) => void;
};

export function DemandCard({ demand, canManage = false, onDelete }: DemandCardProps) {
  const navigate = useNavigate();
  const clubName = demand.club?.name ?? "—";
  const positions = (demand as { positions?: string[] }).positions?.length
    ? (demand as { positions: string[] }).positions
    : [demand.position].filter(Boolean);
  const positionLabel = positions.map(formatPosition).join(", ");
  const candidatesCount = demand.candidates_count ?? 0;
  const quantityNeeded = demand.quantity_needed ?? 1;
  const progress = `${candidatesCount}/${quantityNeeded}`;

  const priorityVariant =
    demand.priority === "critical"
      ? "destructive"
      : demand.priority === "high"
        ? "default"
        : "secondary";

  const handleCardClick = () => {
    navigate(`/demands/${demand.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(demand);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/demands/${demand.id}/edit`);
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">
                {positionLabel} · {demand.season}
              </span>
              <Badge variant={priorityVariant} className="text-xs">
                {DEMAND_PRIORITY_LABELS[demand.priority]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {DEMAND_STATUS_LABELS[demand.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{clubName}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Kandydaci: {progress}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleEditClick}
                  title="Edytuj"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDelete}
                    title="Usuń"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            {!canManage && <Target className="h-4 w-4 text-slate-400" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
