import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPlayer,
  fetchPlayerById,
  fetchPlayers,
  updatePlayerStatus,
} from "../api/players.api";
import type { Player, PlayerInput } from "../types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlineDb } from "@/features/offline/db/offlineDb";

export function usePlayers(filters?: {
  search?: string;
  birthYear?: number;
  status?: string;
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

export function useUpdatePlayerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePlayerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
