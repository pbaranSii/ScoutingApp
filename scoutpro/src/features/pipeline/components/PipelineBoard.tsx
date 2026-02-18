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
import type { PlayersFilters } from "@/features/players/api/players.api";
import { PIPELINE_BOARD_COLUMNS, getStatusDotClass } from "../types";
import type { PipelineStatus } from "../types";
import { usePipelineEnrichment } from "../hooks/usePipelineEnrichment";
import { PipelineColumn } from "./PipelineColumn";
import { usePlayers, useUpdatePlayerStatus } from "@/features/players/hooks/usePlayers";
import { toast } from "@/hooks/use-toast";
import type { PipelineFiltersState } from "./PipelineFiltersPanel";

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

function toPlayersFilters(filters: PipelineFiltersState): PlayersFilters {
  const f: PlayersFilters = {};
  if (filters.status) f.status = filters.status as PlayersFilters["status"];
  if (filters.birthYear) f.birthYear = Number(filters.birthYear);
  if (filters.scoutId) f.scoutId = filters.scoutId;
  if (filters.position) f.primary_position = filters.position;
  if (filters.clubId) f.clubIds = [filters.clubId];
  return f;
}

type PipelineBoardProps = {
  search?: string;
  filters?: PipelineFiltersState;
};

const DEFAULT_FILTERS: PipelineFiltersState = {
  status: "",
  birthYear: "",
  scoutId: "",
  position: "",
  clubId: "",
};

export function PipelineBoard({ search = "", filters = DEFAULT_FILTERS }: PipelineBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const playersFilters = toPlayersFilters(filters);
  const { data, isLoading } = usePlayers(playersFilters);
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
  const { statusSince, latestRating } = usePipelineEnrichment(filteredPlayers);

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
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PIPELINE_BOARD_COLUMNS.map((column) => {
            const count = (columns[column.id] ?? []).length;
            const tabLabel = column.shortLabel ?? column.label;
            return (
              <button
                key={column.id}
                type="button"
                onClick={() => {
                  document.getElementById(column.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotClass(column.id as PipelineStatus)}`}
                  aria-hidden
                />
                <span>
                  {tabLabel} ({count})
                </span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 lg:grid-cols-6">
          {PIPELINE_BOARD_COLUMNS.map((column) => (
            <div key={column.id} id={column.id}>
              <PipelineColumn
                id={column.id}
                title={column.label}
                players={columns[column.id] ?? []}
                statusId={column.id as PipelineStatus}
                statusSince={statusSince}
                latestRating={latestRating}
              />
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
