import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCandidatesByDemand,
  addCandidate,
  removeCandidate,
  fetchDemandSuggestions,
} from "../api/candidates.api";
import type { DemandAssignmentType } from "../types";

export function useDemandCandidates(demandId: string | null) {
  return useQuery({
    queryKey: ["demand-candidates", demandId],
    queryFn: () => (demandId ? fetchCandidatesByDemand(demandId) : Promise.resolve([])),
    enabled: Boolean(demandId),
  });
}

export function useDemandSuggestions(demandId: string | null) {
  return useQuery({
    queryKey: ["demand-suggestions", demandId],
    queryFn: () => (demandId ? fetchDemandSuggestions(demandId) : Promise.resolve([])),
    enabled: Boolean(demandId),
  });
}

export function useAddCandidate(demandId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      playerId,
      assignmentType = "manual",
    }: {
      playerId: string;
      assignmentType?: DemandAssignmentType;
    }) =>
      demandId ? addCandidate(demandId, playerId, assignmentType) : Promise.reject(new Error("Brak zapotrzebowania")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demand-candidates", demandId] });
      queryClient.invalidateQueries({ queryKey: ["demand-suggestions", demandId] });
      queryClient.invalidateQueries({ queryKey: ["player-demand", demandId] });
      queryClient.invalidateQueries({ queryKey: ["player-demands"] });
      queryClient.invalidateQueries({ queryKey: ["player-demands-for-player"] });
    },
  });
}

export function useRemoveCandidate(demandId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) =>
      demandId ? removeCandidate(demandId, playerId) : Promise.reject(new Error("Brak zapotrzebowania")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demand-candidates", demandId] });
      queryClient.invalidateQueries({ queryKey: ["demand-suggestions", demandId] });
      queryClient.invalidateQueries({ queryKey: ["player-demand", demandId] });
      queryClient.invalidateQueries({ queryKey: ["player-demands"] });
      queryClient.invalidateQueries({ queryKey: ["player-demands-for-player"] });
    },
  });
}
