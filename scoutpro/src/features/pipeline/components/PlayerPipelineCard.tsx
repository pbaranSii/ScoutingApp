import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Player } from "@/features/players/types";
import { Link } from "react-router-dom";

type PlayerPipelineCardProps = {
  player: Player;
};

export function PlayerPipelineCard({ player }: PlayerPipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Link
      to={`/players/${player.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        "block rounded-lg border bg-white p-3 shadow-sm hover:border-blue-200 hover:bg-blue-50",
        isDragging ? "opacity-60" : "opacity-100",
      ].join(" ")}
    >
      <div className="text-sm font-semibold text-slate-900">
        {player.last_name} {player.first_name}
      </div>
      <div className="text-xs text-slate-500">
        {player.birth_year} • {player.primary_position ?? "-"}
      </div>
    </Link>
  );
}
