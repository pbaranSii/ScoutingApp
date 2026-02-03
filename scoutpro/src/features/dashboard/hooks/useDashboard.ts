import { useQuery } from "@tanstack/react-query";
import { startOfMonth, subDays, format } from "date-fns";
import {
  fetchObservationCounts,
  fetchPlayerCount,
  fetchPlayersByStatus,
  fetchRecentObservations,
  fetchTopRankedPlayers,
} from "../api/dashboard.api";

export function useObservationStats() {
  return useQuery({
    queryKey: ["dashboard", "observations"],
    queryFn: () =>
      fetchObservationCounts(
        format(startOfMonth(new Date()), "yyyy-MM-dd"),
        format(subDays(new Date(), 7), "yyyy-MM-dd")
      ),
  });
}

export function usePlayerCount() {
  return useQuery({
    queryKey: ["dashboard", "players-count"],
    queryFn: fetchPlayerCount,
  });
}

export function usePlayersByStatus() {
  return useQuery({
    queryKey: ["dashboard", "players-status"],
    queryFn: fetchPlayersByStatus,
  });
}

export function useRecentObservations() {
  return useQuery({
    queryKey: ["dashboard", "recent-observations"],
    queryFn: fetchRecentObservations,
  });
}

export function useTopRankedPlayers() {
  return useQuery({
    queryKey: ["dashboard", "top-ranked"],
    queryFn: fetchTopRankedPlayers,
  });
}
