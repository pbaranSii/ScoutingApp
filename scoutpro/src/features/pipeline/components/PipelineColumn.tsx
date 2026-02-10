import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Player } from "@/features/players/types";
import type { PipelineStatus } from "../types";
import { AddPlayerToColumnModal } from "./AddPlayerToColumnModal";
import { PlayerPipelineCard } from "./PlayerPipelineCard";

type PipelineColumnProps = {
  id: string;
  title: string;
  players: Player[];
};

export function PipelineColumn({ id, title, players }: PipelineColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div ref={setNodeRef} className="flex min-h-[200px] flex-col gap-3 rounded-lg border bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setAddModalOpen(true)}
            aria-label={`Dodaj zawodnika do ${title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
            {players.length}
          </span>
        </div>
      </div>
      {addModalOpen && (
        <AddPlayerToColumnModal
          columnId={id as PipelineStatus}
          columnLabel={title}
          onClose={() => setAddModalOpen(false)}
        />
      )}
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
