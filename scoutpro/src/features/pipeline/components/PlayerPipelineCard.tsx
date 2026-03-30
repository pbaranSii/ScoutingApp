import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Player } from "@/features/players/types";
import { Link } from "react-router-dom";
import { formatPosition } from "@/features/players/positions";
import { birthYearToCategory } from "../utils/ageCategory";

function formatDurationInStatus(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "<1d";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}m`;
  return `${Math.floor(days / 365)}y`;
}

/** Map overall_rating 1-10 to 1-5 stars (filled count). */
function ratingToStars(rating: number): number {
  return Math.round((rating / 10) * 5);
}

type PlayerPipelineCardProps = {
  player: Player;
  statusSince?: string | null;
  latestRating?: number | null;
};

export function PlayerPipelineCard({
  player,
  statusSince,
  latestRating,
}: PlayerPipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const positionLabel = formatPosition(player.primary_position);
  const clubName = player.club?.name ?? "—";
  const ageCat = birthYearToCategory(player.birth_year);
  const stars = latestRating != null ? ratingToStars(latestRating) : null;
  const duration = statusSince ? formatDurationInStatus(statusSince) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "flex gap-2 rounded-lg border bg-white p-3 shadow-sm hover:border-blue-200 hover:bg-blue-50",
        isDragging ? "opacity-60" : "opacity-100",
      ].join(" ")}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none items-start pt-0.5 text-slate-400 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-hidden
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Link to={`/players/${player.id}`} className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900">
          {player.first_name} {player.last_name}
        </div>
        <div className="text-xs text-slate-500">
          {positionLabel} • {player.birth_year}
        </div>
        <div className="mt-1 text-xs text-slate-600">
          {clubName} {ageCat}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-amber-600" aria-label={stars != null ? `${stars} z 5 gwiazdek` : undefined}>
            {stars != null
              ? "★".repeat(stars) + "☆".repeat(5 - stars)
              : "—"}
          </span>
          {duration != null && (
            <span className="text-xs text-slate-400">{duration}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
