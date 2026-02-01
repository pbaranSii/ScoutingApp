import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createObservation,
  deleteObservation,
  fetchObservationById,
  fetchObservations,
  fetchObservationsByPlayer,
  updateObservation,
} from "../api/observations.api";
import type { Observation, ObservationInput } from "../types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlineDb } from "@/features/offline/db/offlineDb";

export function useObservations() {
  const isOnline = useOnlineStatus();
  return useQuery({
    queryKey: ["observations"],
    queryFn: async () => {
      if (!isOnline) {
        const cached = await offlineDb.cachedObservations.toArray();
        return cached.map((item) => item.data) as Observation[];
      }

      const observations = await fetchObservations();
      const now = new Date();
      await offlineDb.cachedObservations.bulkPut(
        observations.map((obs) => ({
          id: obs.id,
          data: obs,
          cachedAt: now,
        }))
      );
      return observations;
    },
  });
}

export function useObservationsByPlayer(playerId: string) {
  return useQuery({
    queryKey: ["observations", "player", playerId],
    queryFn: () => fetchObservationsByPlayer(playerId),
    enabled: Boolean(playerId),
  });
}

export function useCreateObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ObservationInput) => createObservation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      queryClient.invalidateQueries({ queryKey: ["observations", "player"] });
    },
  });
}

export function useObservation(id: string) {
  return useQuery({
    queryKey: ["observation", id],
    queryFn: () => fetchObservationById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ObservationInput> }) =>
      updateObservation(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      queryClient.invalidateQueries({ queryKey: ["observations", "player"] });
      queryClient.invalidateQueries({ queryKey: ["observation", variables.id] });
    },
  });
}

export function useDeleteObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteObservation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      queryClient.invalidateQueries({ queryKey: ["observations", "player"] });
      queryClient.removeQueries({ queryKey: ["observation", id] });
    },
  });
}
