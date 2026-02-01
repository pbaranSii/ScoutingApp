import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Player } from "@/features/players/types";
import { PlayerPipelineCard } from "./PlayerPipelineCard";

type PipelineColumnProps = {
  id: string;
  title: string;
  players: Player[];
};

export function PipelineColumn({ id, title, players }: PipelineColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex min-h-[200px] flex-col gap-3 rounded-lg border bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
          {players.length}
        </span>
      </div>
      <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <PlayerPipelineCard key={player.id} player={player} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
