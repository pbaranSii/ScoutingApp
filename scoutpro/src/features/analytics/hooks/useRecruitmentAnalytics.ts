import { useQuery } from "@tanstack/react-query";
import type { RecruitmentAnalyticsDateRange, RecruitmentAnalyticsFilters } from "../types";
import {
  fetchPipelineMetrics,
  fetchPlayerList,
  fetchTrends,
  fetchComparisons,
  fetchHeatmap,
  fetchSankey,
} from "../api/recruitmentAnalytics.api";

export function usePipelineMetrics(range: RecruitmentAnalyticsDateRange, filters: RecruitmentAnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "pipeline-metrics", range, filters],
    queryFn: () => fetchPipelineMetrics({ range, filters }),
  });
}

export function usePipelineMetricsEnabled(
  range: RecruitmentAnalyticsDateRange,
  filters: RecruitmentAnalyticsFilters,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["analytics", "pipeline-metrics", range, filters],
    queryFn: () => fetchPipelineMetrics({ range, filters }),
    enabled,
  });
}

export function useAnalyticsPlayerList(params: {
  status: "first_contact" | "observed" | "shortlist" | "trial" | "offer" | "signed" | "rejected";
  range: RecruitmentAnalyticsDateRange;
  filters: RecruitmentAnalyticsFilters;
  page: number;
  limit: number;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["analytics", "player-list", params.status, params.range, params.filters, params.page, params.limit],
    queryFn: () =>
      fetchPlayerList({
        status: params.status,
        range: params.range,
        filters: params.filters,
        page: params.page,
        limit: params.limit,
      }),
    enabled: params.enabled,
  });
}

export function useTrends(
  range: RecruitmentAnalyticsDateRange,
  filters: RecruitmentAnalyticsFilters,
  granularity: "day" | "week" | "month" | "quarter",
  enabled: boolean
) {
  return useQuery({
    queryKey: ["analytics", "trends", range, filters, granularity],
    queryFn: () => fetchTrends({ range, filters, granularity }),
    enabled,
  });
}

export function useComparisons(
  range: RecruitmentAnalyticsDateRange,
  filters: RecruitmentAnalyticsFilters,
  type: "scouts" | "regions" | "positions" | "sources" | "ages",
  enabled: boolean
) {
  return useQuery({
    queryKey: ["analytics", "comparisons", type, range, filters],
    queryFn: () => fetchComparisons({ range, filters, type }),
    enabled,
  });
}

export function useHeatmap(range: RecruitmentAnalyticsDateRange, filters: RecruitmentAnalyticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["analytics", "heatmap", range, filters],
    queryFn: () => fetchHeatmap({ range, filters }),
    enabled,
  });
}

export function useSankey(range: RecruitmentAnalyticsDateRange, filters: RecruitmentAnalyticsFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["analytics", "sankey", range, filters],
    queryFn: () => fetchSankey({ range, filters }),
    enabled,
  });
}

