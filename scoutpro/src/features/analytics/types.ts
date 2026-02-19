export type RecruitmentAnalyticsFilters = {
  scoutIds: string[];
  clubIds: string[];
  regionIds: string[];
  birthYears: number[];
  positions: string[];
  sources: string[];
  ranks: string[];
};

export type RecruitmentAnalyticsDateRange = {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
};

export type PipelineMetricsResponse = {
  kpi: {
    totalCandidates: number;
    conversionRate: number;
    timeToHireDaysAvg: number;
    activeTrials: number;
    signed?: number;
    firstContact?: number;
  };
  funnel: Record<
    "first_contact" | "observed" | "shortlist" | "trial" | "offer" | "signed" | "rejected",
    number
  >;
  bottlenecks: { player_id: string; status: string; days_in_status: number; max_days?: number }[];
  settings?: Record<string, string>;
};

export type PlayerListResponse = {
  total: number;
  items: {
    id: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    position: string | null;
    club: string | null;
    status: string;
    days_in_status: number | null;
    last_observation_at: string | null;
    rank: string | null;
    total_observations: number;
  }[];
};

export type TrendsBucket = {
  t: string; // YYYY-MM-DD
  first_contact: number;
  observed: number;
  shortlist: number;
  trial: number;
  offer: number;
  signed: number;
  rejected: number;
};

export type TrendsResponse = {
  granularity: string;
  buckets: TrendsBucket[];
};

export type HeatmapRow = {
  region_id: string | null;
  region_name: string;
  observed: number;
  shortlist: number;
  trial: number;
  offer: number;
  signed: number;
  rejected: number;
};

export type SankeyResponse = {
  nodes: { id: string; label: string }[];
  links: { source: string; target: string; value: number }[];
};

