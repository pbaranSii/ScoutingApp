import { useQuery } from "@tanstack/react-query";
import { startOfMonth, subDays, format } from "date-fns";
import {
  fetchObservationCounts,
  fetchPlayerCount,
  fetchPlayersByStatus,
  fetchRecentObservations,
  fetchRecentPlayers,
  fetchTopRankedPlayers,
} from "../api/dashboard.api";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { fetchTasksForUser } from "@/features/tasks/api/tasks.api";
import { fetchRecentDemands } from "@/features/demands/api/demands.api";

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

export function useRecentPlayers(limit = 8) {
  const { data: profile } = useCurrentUserProfile();
  const createdBy =
    profile?.business_role === "scout" && profile?.id ? profile.id : undefined;
  return useQuery({
    queryKey: ["dashboard", "recent-players", limit, createdBy],
    queryFn: () => fetchRecentPlayers(limit, createdBy),
  });
}

export function useRecentObservations(limit = 5) {
  const { data: profile } = useCurrentUserProfile();
  const scoutId =
    profile?.business_role === "scout" && profile?.id ? profile.id : undefined;
  return useQuery({
    queryKey: ["dashboard", "recent-observations", limit, scoutId],
    queryFn: () => fetchRecentObservations(limit, scoutId),
  });
}

export function useTopRankedPlayers() {
  return useQuery({
    queryKey: ["dashboard", "top-ranked"],
    queryFn: fetchTopRankedPlayers,
  });
}

export function useMyTasks(limit = 8) {
  const { data: profile } = useCurrentUserProfile();
  const userId = profile?.id ?? "";
  return useQuery({
    queryKey: ["dashboard", "my-tasks", userId, limit],
    queryFn: () => fetchTasksForUser(userId, limit),
    enabled: Boolean(userId),
  });
}

export function useRecentDemands(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "recent-demands", limit],
    queryFn: () => fetchRecentDemands(limit),
  });
}
