import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createObservation,
  deleteObservation,
  deleteObservationsByPlayer,
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
      queryClient.setQueryData<Observation[] | undefined>(["observations"], (observations) =>
        observations?.filter((observation) => observation.id !== id)
      );
      queryClient.setQueriesData<Observation[] | undefined>(
        { queryKey: ["observations", "player"], exact: false },
        (observations) => observations?.filter((observation) => observation.id !== id)
      );
      queryClient.removeQueries({ queryKey: ["observation", id] });
      offlineDb.cachedObservations.delete(id).catch((error) => {
        console.warn("Failed to delete cached observation:", error);
      });
    },
  });
}

export function useDeleteObservationsByPlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: string) => deleteObservationsByPlayer(playerId),
    onSuccess: async (_data, playerId) => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      queryClient.invalidateQueries({ queryKey: ["observations", "player", playerId] });
      queryClient.setQueryData<Observation[] | undefined>(["observations"], (observations) =>
        observations?.filter((observation) => observation.player_id !== playerId)
      );
      queryClient.removeQueries({ queryKey: ["observations", "player", playerId] });

      try {
        const cached = await offlineDb.cachedObservations.toArray();
        const toDelete = cached
          .filter((item) => (item.data as Observation | undefined)?.player_id === playerId)
          .map((item) => item.id);
        if (toDelete.length > 0) {
          await offlineDb.cachedObservations.bulkDelete(toDelete);
        }
      } catch (error) {
        console.warn("Failed to delete cached observations by player:", error);
      }
    },
  });
}
