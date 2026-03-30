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

export type UseObservationsOptions = {
  page?: number;
  pageSize?: number;
  scoutId?: string;
};

export function useObservations(options?: UseObservationsOptions) {
  const isOnline = useOnlineStatus();
  const usePagination = options?.page != null || options?.pageSize != null;
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 100;

  const query = useQuery({
    queryKey: ["observations", options],
    queryFn: async (): Promise<{ data: Observation[]; total?: number }> => {
      if (!isOnline) {
        const cached = await offlineDb.cachedObservations.toArray();
        let all = cached.map((item) => item.data) as Observation[];
        if (options?.scoutId) {
          all = all.filter((o) => o.scout_id === options.scoutId);
        }
        if (usePagination) {
          const from = (page - 1) * pageSize;
          return { data: all.slice(from, from + pageSize), total: all.length };
        }
        return { data: all };
      }

      const result = await fetchObservations(
        usePagination
          ? { page, pageSize, scoutId: options?.scoutId }
          : options?.scoutId
            ? { scoutId: options.scoutId }
            : undefined
      );
      if (Array.isArray(result)) {
        const now = new Date();
        await offlineDb.cachedObservations.bulkPut(
          result.map((obs) => ({
            id: obs.id,
            data: obs,
            cachedAt: now,
          }))
        );
        return { data: result };
      }
      const { data: observations, total: totalCount } = result;
      const now = new Date();
      await offlineDb.cachedObservations.bulkPut(
        observations.map((obs) => ({
          id: obs.id,
          data: obs,
          cachedAt: now,
        }))
      );
      return { data: observations, total: totalCount };
    },
  });

  const rawData = query.data;
  const data = rawData?.data ?? [];
  const total = rawData?.total;

  return {
    ...query,
    data,
    total,
  };
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

function isObservationsListCache(
  value: unknown
): value is { data: Observation[]; total?: number } {
  return (
    value != null &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data: Observation[] }).data)
  );
}

export function useDeleteObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteObservation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      queryClient.invalidateQueries({ queryKey: ["observations", "player"] });
      queryClient.setQueriesData(
        { queryKey: ["observations"], exact: false },
        (prev: unknown) => {
          if (isObservationsListCache(prev)) {
            const next = prev.data.filter((obs) => obs.id !== id);
            return { ...prev, data: next, total: (prev.total ?? prev.data.length) - 1 };
          }
          if (Array.isArray(prev)) {
            return prev.filter((obs: Observation) => obs.id !== id);
          }
          return prev;
        }
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
      queryClient.setQueriesData(
        { queryKey: ["observations"], exact: false },
        (prev: unknown) => {
          if (isObservationsListCache(prev)) {
            const next = prev.data.filter((obs) => obs.player_id !== playerId);
            const removed = prev.data.length - next.length;
            return {
              ...prev,
              data: next,
              total: prev.total != null ? Math.max(0, prev.total - removed) : undefined,
            };
          }
          if (Array.isArray(prev)) {
            return prev.filter((obs: Observation) => obs.player_id !== playerId);
          }
          return prev;
        }
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
