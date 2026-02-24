import { supabase } from "@/lib/supabase";
import type {
  LoginHistoryFilters,
  LoginHistoryResponse,
  MonthlyBreakdownResponse,
  TrendsFilters,
  UsageOverview,
  UsageTrendsResponse,
  UsageUserDetail,
  UsageUsersFilters,
  UsageUsersResponse,
} from "../types";

export async function fetchUsageOverview(month?: string): Promise<UsageOverview> {
  const { data, error } = await (supabase as any).rpc("admin_usage_overview", {
    p_month: month || null,
  });
  if (error) throw error;
  return data as UsageOverview;
}

export async function fetchUsageUsers(filters: UsageUsersFilters): Promise<UsageUsersResponse> {
  const { data, error } = await (supabase as any).rpc("admin_usage_users", {
    p_status: filters.status,
    p_role: filters.role,
    p_sort_by: filters.sortBy,
    p_page: filters.page,
    p_per_page: filters.perPage,
  });
  if (error) throw error;
  return data as UsageUsersResponse;
}

export async function fetchUsageUserDetail(userId: string): Promise<UsageUserDetail> {
  const { data, error } = await (supabase as any).rpc("admin_usage_user_detail", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data as UsageUserDetail;
}

export async function fetchLoginHistory(filters: LoginHistoryFilters): Promise<LoginHistoryResponse> {
  const { data, error } = await (supabase as any).rpc("admin_usage_login_history", {
    p_user_id: filters.userId || null,
    p_date_from: filters.dateFrom || null,
    p_date_to: filters.dateTo || null,
    p_device_type: filters.deviceType || null,
    p_page: filters.page,
    p_per_page: filters.perPage,
  });
  if (error) throw error;
  return data as LoginHistoryResponse;
}

export async function fetchUsageTrends(filters: TrendsFilters): Promise<UsageTrendsResponse> {
  const { data, error } = await (supabase as any).rpc("admin_usage_trends", {
    p_date_from: filters.dateFrom,
    p_date_to: filters.dateTo,
    p_granularity: filters.granularity,
  });
  if (error) throw error;
  return data as UsageTrendsResponse;
}

export async function fetchMonthlyBreakdown(
  dateFrom: string,
  dateTo: string
): Promise<MonthlyBreakdownResponse> {
  const { data, error } = await (supabase as any).rpc("admin_usage_monthly_breakdown", {
    p_date_from: dateFrom,
    p_date_to: dateTo,
  });
  if (error) throw error;
  return data as MonthlyBreakdownResponse;
}
