import { supabase } from "@/lib/supabase";
import type {
  HeatmapRow,
  PipelineMetricsResponse,
  PlayerListResponse,
  RecruitmentAnalyticsDateRange,
  RecruitmentAnalyticsFilters,
  SankeyResponse,
  TrendsResponse,
} from "../types";

function toRpcFilters(filters: RecruitmentAnalyticsFilters) {
  return {
    scout_ids: filters.scoutIds,
    club_ids: filters.clubIds,
    region_ids: filters.regionIds,
    birth_years: filters.birthYears,
    positions: filters.positions,
    sources: filters.sources,
    ranks: filters.ranks,
  };
}

export async function fetchPipelineMetrics(params: {
  range: RecruitmentAnalyticsDateRange;
  filters: RecruitmentAnalyticsFilters;
}): Promise<PipelineMetricsResponse> {
  const { dateFrom, dateTo } = params.range;
  const { data, error } = await (supabase as any).rpc("analytics_pipeline_metrics", {
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_filters: toRpcFilters(params.filters),
  });

  if (error) throw error;
  return data as unknown as PipelineMetricsResponse;
}

export async function fetchPlayerList(params: {
  status:
    | "first_contact"
    | "observed"
    | "shortlist"
    | "trial"
    | "offer"
    | "signed"
    | "rejected";
  range: RecruitmentAnalyticsDateRange;
  filters: RecruitmentAnalyticsFilters;
  page: number;
  limit: number;
}): Promise<PlayerListResponse> {
  const { data, error } = await (supabase as any).rpc("analytics_player_list", {
    p_status: params.status,
    p_date_from: params.range.dateFrom,
    p_date_to: params.range.dateTo,
    p_filters: toRpcFilters(params.filters),
    p_page: params.page,
    p_limit: params.limit,
  });
  if (error) throw error;
  return data as unknown as PlayerListResponse;
}

export async function fetchTrends(params: {
  range: RecruitmentAnalyticsDateRange;
  granularity: "day" | "week" | "month" | "quarter";
  filters: RecruitmentAnalyticsFilters;
}): Promise<TrendsResponse> {
  const { data, error } = await (supabase as any).rpc("analytics_trends", {
    p_date_from: params.range.dateFrom,
    p_date_to: params.range.dateTo,
    p_granularity: params.granularity,
    p_filters: toRpcFilters(params.filters),
  });
  if (error) throw error;
  return data as unknown as TrendsResponse;
}

export async function fetchComparisons(params: {
  type: "scouts" | "regions" | "positions" | "sources" | "ages";
  range: RecruitmentAnalyticsDateRange;
  filters: RecruitmentAnalyticsFilters;
}): Promise<
  {
    id: string;
    label: string;
    first_contact: number;
    signed: number;
    success_rate: number;
  }[]
> {
  const { data, error } = await (supabase as any).rpc("analytics_comparisons", {
    p_type: params.type,
    p_date_from: params.range.dateFrom,
    p_date_to: params.range.dateTo,
    p_filters: toRpcFilters(params.filters),
  });
  if (error) throw error;
  return (data ?? []) as unknown as {
    id: string;
    label: string;
    first_contact: number;
    signed: number;
    success_rate: number;
  }[];
}

export async function fetchHeatmap(params: {
  range: RecruitmentAnalyticsDateRange;
  filters: RecruitmentAnalyticsFilters;
}): Promise<HeatmapRow[]> {
  const { data, error } = await (supabase as any).rpc("analytics_heatmap", {
    p_date_from: params.range.dateFrom,
    p_date_to: params.range.dateTo,
    p_filters: toRpcFilters(params.filters),
  });
  if (error) throw error;
  return (data ?? []) as unknown as HeatmapRow[];
}

export async function fetchSankey(params: {
  range: RecruitmentAnalyticsDateRange;
  filters: RecruitmentAnalyticsFilters;
}): Promise<SankeyResponse> {
  const { data, error } = await (supabase as any).rpc("analytics_sankey", {
    p_date_from: params.range.dateFrom,
    p_date_to: params.range.dateTo,
    p_filters: toRpcFilters(params.filters),
  });
  if (error) throw error;
  return data as unknown as SankeyResponse;
}

