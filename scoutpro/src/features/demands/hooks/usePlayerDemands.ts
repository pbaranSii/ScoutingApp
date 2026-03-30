import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPlayerDemands,
  fetchPlayerDemandById,
  createPlayerDemand,
  updatePlayerDemand,
  deletePlayerDemand,
  type CreatePlayerDemandInput,
  type UpdatePlayerDemandInput,
} from "../api/demands.api";
import type { PlayerDemand, PlayerDemandFilters } from "../types";

export function usePlayerDemands(filters: PlayerDemandFilters = {}) {
  return useQuery({
    queryKey: ["player-demands", filters],
    queryFn: () => fetchPlayerDemands(filters),
  });
}

export function usePlayerDemand(id: string | null) {
  return useQuery({
    queryKey: ["player-demand", id],
    queryFn: () => (id ? fetchPlayerDemandById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useCreatePlayerDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlayerDemandInput) => createPlayerDemand(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-demands"] });
    },
  });
}

export function useUpdatePlayerDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlayerDemandInput }) => updatePlayerDemand(id, input),
    onSuccess: (updated: PlayerDemand) => {
      queryClient.invalidateQueries({ queryKey: ["player-demands"] });
      queryClient.invalidateQueries({ queryKey: ["player-demand", updated.id] });
    },
  });
}

export function useDeletePlayerDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlayerDemand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-demands"] });
    },
  });
}
