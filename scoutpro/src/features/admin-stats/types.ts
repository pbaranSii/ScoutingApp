export type UsageOverview = {
  mau: number;
  mau_prev: number;
  observations_month: number;
  avg_session_minutes: number;
  new_users_month: number;
  records_month: number;
  active_users_count_30d: number;
  last_activity: {
    user_id: string;
    full_name: string | null;
    action: string;
    started_at: string;
  } | null;
  by_role: Array<{
    role: string;
    total_users: number;
    active_30d: number;
    active_pct: number;
    avg_observations_month: number;
    avg_session_min: number;
  }>;
};

export type UsageUserRow = {
  id: string;
  full_name: string | null;
  email: string;
  business_role: string;
  last_login_at: string | null;
  login_count: number;
  avg_session_min: number;
  observations_month: number;
  is_active_30d: boolean;
};

export type UsageUsersResponse = {
  data: UsageUserRow[];
  total: number;
};

export type UserDetailSession = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  device_type: string | null;
  browser: string | null;
};

export type UsageUserDetail = {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    business_role: string;
    last_login_at: string | null;
    login_count: number;
  };
  avg_session_min: number;
  logins_30d: number;
  logins_per_week: number;
  observations_30d: number;
  players_30d: number;
  pipeline_changes_30d: number;
  last_logins: UserDetailSession[];
};

export type LoginHistoryRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  business_role: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  device_type: string | null;
  browser: string | null;
  ip_address: string | null;
};

export type LoginHistoryResponse = {
  data: LoginHistoryRow[];
  total: number;
};

export type TrendPoint = {
  bucket: string;
  active_users: number;
  observations_count: number;
  avg_session_min: number;
};

export type Top10User = {
  user_id: string;
  full_name: string | null;
  logins_30d: number;
  observations_30d: number;
  total_hours: number;
  activity_points: number;
};

export type UsageTrendsResponse = {
  series: TrendPoint[];
  top10: Top10User[];
};

export type UsageUsersFilters = {
  status: "all" | "active" | "inactive";
  role: string;
  sortBy: "activity" | "last_login" | "name";
  page: number;
  perPage: number;
};

export type LoginHistoryFilters = {
  userId: string | null;
  dateFrom: string;
  dateTo: string;
  deviceType: string | null;
  page: number;
  perPage: number;
};

export type TrendsFilters = {
  dateFrom: string;
  dateTo: string;
  granularity: "day" | "week" | "month";
};

export type MonthlyBreakdownRow = {
  user_id: string;
  full_name: string | null;
  email: string;
  business_role: string;
  month: string;
  observations_count: number;
  players_count: number;
};

export type MonthlyBreakdownResponse = {
  data: MonthlyBreakdownRow[];
};
