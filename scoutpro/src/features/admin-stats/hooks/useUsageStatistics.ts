import { useQuery } from "@tanstack/react-query";
import {
  fetchLoginHistory,
  fetchMonthlyBreakdown,
  fetchUsageOverview,
  fetchUsageTrends,
  fetchUsageUserDetail,
  fetchUsageUsers,
} from "../api/usageStatistics.api";
import type {
  LoginHistoryFilters,
  TrendsFilters,
  UsageUsersFilters,
} from "../types";

export function useUsageOverview(month?: string) {
  return useQuery({
    queryKey: ["admin", "usage-overview", month],
    queryFn: () => fetchUsageOverview(month),
  });
}

export function useUsageUsers(filters: UsageUsersFilters) {
  return useQuery({
    queryKey: ["admin", "usage-users", filters],
    queryFn: () => fetchUsageUsers(filters),
  });
}

export function useUsageUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "usage-user-detail", userId],
    queryFn: () => fetchUsageUserDetail(userId!),
    enabled: Boolean(userId),
  });
}

export function useLoginHistory(filters: LoginHistoryFilters) {
  return useQuery({
    queryKey: ["admin", "login-history", filters],
    queryFn: () => fetchLoginHistory(filters),
  });
}

export function useUsageTrends(filters: TrendsFilters) {
  return useQuery({
    queryKey: ["admin", "usage-trends", filters],
    queryFn: () => fetchUsageTrends(filters),
  });
}

export function useMonthlyBreakdown(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["admin", "usage-monthly-breakdown", dateFrom, dateTo],
    queryFn: () => fetchMonthlyBreakdown(dateFrom, dateTo),
    enabled: Boolean(dateFrom && dateTo),
  });
}
