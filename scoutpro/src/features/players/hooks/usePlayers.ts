import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPipelineHistory,
  createPlayer,
  deletePipelineHistoryByPlayer,
  deletePlayer,
  fetchClubs,
  fetchPipelineHistoryByPlayer,
  fetchPlayerById,
  fetchPlayers,
  updatePlayer,
  updatePlayerStatusWithHistory,
} from "../api/players.api";
import type { FetchPlayersResult, PlayersFilters } from "../api/players.api";
import type { PipelineStatus, Player, PlayerInput } from "../types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlineDb } from "@/features/offline/db/offlineDb";
import { normalizePipelineStatus } from "@/features/pipeline/types";
import { useAuthStore } from "@/stores/authStore";

export function usePlayers(filters?: PlayersFilters) {
  const isOnline = useOnlineStatus();
  const usePagination = filters?.page != null || filters?.pageSize != null;
  const pageSize = filters?.pageSize ?? 100;
  const page = filters?.page ?? 1;

  const query = useQuery({
    queryKey: ["players", filters],
    queryFn: async (): Promise<{ data: Player[]; total?: number }> => {
      if (!isOnline) {
        const cached = await offlineDb.cachedPlayers.toArray();
        let all = cached.map((item) => {
          const p = item.data as Player;
          const status = normalizePipelineStatus(p.pipeline_status);
          return status !== p.pipeline_status ? { ...p, pipeline_status: status } : p;
        }) as Player[];
        if (filters?.createdBy) {
          all = all.filter((p) => p.created_by === filters.createdBy);
        }
        if (usePagination) {
          const from = (page - 1) * pageSize;
          return { data: all.slice(from, from + pageSize), total: all.length };
        }
        return { data: all };
      }

      const result = await fetchPlayers(filters);
      if (Array.isArray(result)) {
        const now = new Date();
        await offlineDb.cachedPlayers.bulkPut(
          result.map((player) => ({
            id: player.id,
            data: player,
            cachedAt: now,
          }))
        );
        return { data: result };
      }
      const { data: players, total: totalCount } = result as FetchPlayersResult;
      const now = new Date();
      await offlineDb.cachedPlayers.bulkPut(
        players.map((player) => ({
          id: player.id,
          data: player,
          cachedAt: now,
        }))
      );
      return { data: players, total: totalCount };
    },
  });

  const rawData = query.data;
  const data = Array.isArray(rawData) ? rawData : rawData?.data ?? [];
  const total = rawData && !Array.isArray(rawData) ? rawData.total : undefined;

  return {
    ...query,
    data,
    total,
  };
}

export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: fetchClubs,
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ["player", id],
    queryFn: () => fetchPlayerById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlayerInput) => createPlayer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PlayerInput> }) =>
      updatePlayer(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["player", variables.id] });
    },
  });
}

type PlayersQueryData = { data: Player[]; total?: number };

function updatePlayersCache(
  prev: PlayersQueryData | undefined,
  updater: (list: Player[]) => Player[]
): PlayersQueryData | undefined {
  if (!prev) return prev;
  const list = Array.isArray(prev) ? (prev as unknown as Player[]) : prev.data;
  const next = updater(list ?? []);
  if (Array.isArray(prev)) return { data: next, total: prev.length };
  return {
    ...prev,
    data: next,
    total: prev.total != null ? Math.max(0, prev.total - (list.length - next.length)) : undefined,
  };
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlayer(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.setQueriesData<PlayersQueryData | undefined>(
        { queryKey: ["players"], exact: false },
        (prev) => updatePlayersCache(prev, (players) => players?.filter((player) => player.id !== id) ?? [])
      );
      queryClient.removeQueries({ queryKey: ["player", id] });
      offlineDb.cachedPlayers.delete(id).catch((error) => {
        console.warn("Failed to delete cached player:", error);
      });
    },
  });
}

export function useDeletePipelineHistoryByPlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: string) => deletePipelineHistoryByPlayer(playerId),
    onSuccess: (_data, playerId) => {
      queryClient.removeQueries({ queryKey: ["pipeline-history", playerId] });
    },
  });
}

export function useUpdatePlayerStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({
      id,
      status,
      fromStatus,
    }: {
      id: string;
      status: PipelineStatus;
      fromStatus?: string | null;
    }) =>
      updatePlayerStatusWithHistory({
        id,
        status,
        from_status: fromStatus ?? null,
        changed_by: user?.id ?? null,
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["players"] });
      const previousPlayers = queryClient.getQueriesData<PlayersQueryData>({ queryKey: ["players"] });
      queryClient.setQueriesData<PlayersQueryData | undefined>(
        { queryKey: ["players"], exact: false },
        (prev) =>
          updatePlayersCache(prev, (players) =>
            players?.map((player) =>
              player.id === variables.id
                ? { ...player, pipeline_status: variables.status }
                : player
            ) ?? []
          )
      );
      return { previousPlayers };
    },
    onError: (_error, _variables, context) => {
      context?.previousPlayers?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-history", variables.id] });
    },
  });
}

export function usePipelineHistory(playerId: string) {
  return useQuery({
    queryKey: ["pipeline-history", playerId],
    queryFn: () => fetchPipelineHistoryByPlayer(playerId),
    enabled: Boolean(playerId),
  });
}

export function useCreatePipelineHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      player_id: string;
      from_status?: string | null;
      to_status: string;
      changed_by: string;
      reason?: string | null;
    }) => createPipelineHistory(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-history", variables.player_id] });
    },
  });
}
