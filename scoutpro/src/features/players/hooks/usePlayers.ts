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
import type { PipelineStatus, Player, PlayerInput } from "../types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlineDb } from "@/features/offline/db/offlineDb";
import { useAuthStore } from "@/stores/authStore";

export function usePlayers(filters?: {
  search?: string;
  birthYear?: number;
  status?: PipelineStatus;
}) {
  const isOnline = useOnlineStatus();
  return useQuery({
    queryKey: ["players", filters],
    queryFn: async () => {
      if (!isOnline) {
        const cached = await offlineDb.cachedPlayers.toArray();
        return cached.map((item) => item.data) as Player[];
      }

      const players = await fetchPlayers(filters);
      const now = new Date();
      await offlineDb.cachedPlayers.bulkPut(
        players.map((player) => ({
          id: player.id,
          data: player,
          cachedAt: now,
        }))
      );
      return players;
    },
  });
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
    mutationFn: ({ id, input }: { id: string; input: PlayerInput }) =>
      updatePlayer(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["player", variables.id] });
    },
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlayer(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.setQueriesData<Player[] | undefined>(
        { queryKey: ["players"], exact: false },
        (players) => players?.filter((player) => player.id !== id)
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
      const previousPlayers = queryClient.getQueriesData<Player[]>({ queryKey: ["players"] });
      queryClient.setQueriesData<Player[] | undefined>(
        { queryKey: ["players"], exact: false },
        (players) =>
          players?.map((player) =>
            player.id === variables.id
              ? {
                  ...player,
                  pipeline_status: variables.status,
                }
              : player
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
