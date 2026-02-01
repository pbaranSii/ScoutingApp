import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPlayer,
  deletePlayer,
  fetchClubs,
  fetchPlayerById,
  fetchPlayers,
  updatePlayer,
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
      queryClient.removeQueries({ queryKey: ["player", id] });
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
