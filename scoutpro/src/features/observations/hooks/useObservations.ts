import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createObservation, fetchObservations } from "../api/observations.api";
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

export function useCreateObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ObservationInput) => createObservation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}
