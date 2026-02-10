import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Player } from "@/features/players/types";
import { PIPELINE_BOARD_COLUMNS } from "../types";
import { PipelineColumn } from "./PipelineColumn";
import { usePlayers, useUpdatePlayerStatus } from "@/features/players/hooks/usePlayers";
import { toast } from "@/hooks/use-toast";

type BoardColumnId = (typeof PIPELINE_BOARD_COLUMNS)[number]["id"];
type ColumnState = Record<BoardColumnId, Player[]>;

const EMPTY_PLAYERS: Player[] = [];

function groupByStatus(players: Player[]): ColumnState {
  return PIPELINE_BOARD_COLUMNS.reduce((acc, column) => {
    acc[column.id] = players.filter(
      (player) => (player.pipeline_status ?? "unassigned") === column.id
    );
    return acc;
  }, {} as ColumnState);
}

function findColumnByPlayerId(playerId: string, columns: ColumnState): BoardColumnId | undefined {
  return PIPELINE_BOARD_COLUMNS.find((column) =>
    columns[column.id].some((player) => player.id === playerId)
  )?.id;
}

type PipelineBoardProps = {
  search?: string;
};

export function PipelineBoard({ search = "" }: PipelineBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { data, isLoading } = usePlayers();
  const players = data ?? EMPTY_PLAYERS;
  const { mutateAsync: updateStatus } = useUpdatePlayerStatus();
  const [columns, setColumns] = useState<ColumnState>(() => groupByStatus([]));

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return players;
    return players.filter((player) => {
      const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
      const clubName = player.club?.name?.toLowerCase() ?? "";
      return fullName.includes(query) || clubName.includes(query);
    });
  }, [players, search]);

  const initialColumns = useMemo(() => groupByStatus(filteredPlayers), [filteredPlayers]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceColumn = findColumnByPlayerId(activeId, columns);
    const targetColumn = PIPELINE_BOARD_COLUMNS.find((c) => c.id === overId)
      ? (overId as BoardColumnId)
      : findColumnByPlayerId(overId, columns);

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) {
      return;
    }

    const activePlayer = columns[sourceColumn].find((p) => p.id === activeId);
    if (!activePlayer) return;

    setColumns((prev) => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter((p) => p.id !== activeId),
      [targetColumn]: [activePlayer, ...prev[targetColumn]],
    }));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const sourceColumn = findColumnByPlayerId(activeId, initialColumns);
    const targetColumn = PIPELINE_BOARD_COLUMNS.find((c) => c.id === overId)
      ? (overId as BoardColumnId)
      : findColumnByPlayerId(overId, columns);

    if (!sourceColumn || !targetColumn) return;

    if (sourceColumn === targetColumn) {
      const sourceItems = columns[sourceColumn];
      const oldIndex = sourceItems.findIndex((p) => p.id === activeId);
      const newIndex = sourceItems.findIndex((p) => p.id === overId);
      if (oldIndex !== newIndex) {
        setColumns((prev) => ({
          ...prev,
          [sourceColumn]: arrayMove(prev[sourceColumn], oldIndex, newIndex),
        }));
      }
      return;
    }

    try {
      const result = await updateStatus({
        id: activeId,
        status: targetColumn,
        fromStatus: sourceColumn,
      });
      if (result?.historyError) {
        toast({
          title: "Status zapisany",
          description: "Nie udalo sie zapisac wpisu w historii Pipeline.",
        });
      }
    } catch {
      setColumns(initialColumns);
      toast({
        title: "Nie udalo sie zapisac zmiany",
        description: "Sprobuj ponownie za chwile.",
      });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 lg:grid-cols-6">
        {PIPELINE_BOARD_COLUMNS.map((column) => (
          <div key={column.id} id={column.id}>
            <PipelineColumn
              id={column.id}
              title={column.label}
              players={columns[column.id] ?? []}
            />
          </div>
        ))}
      </div>
    </DndContext>
  );
}
