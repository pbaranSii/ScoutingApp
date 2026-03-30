import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import {
  fetchLoginHistory,
  fetchUsageOverview,
  fetchUsageTrends,
  fetchUsageUserDetail,
  fetchUsageUsers,
} from "./usageStatistics.api";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const mockRpc = vi.mocked(supabase).rpc as ReturnType<typeof vi.fn>;

const overviewPayload = {
  mau: 10,
  mau_prev: 8,
  observations_month: 42,
  avg_session_minutes: 12,
  new_users_month: 2,
  records_month: 15,
  active_users_count_30d: 7,
  last_activity: null,
  by_role: [
    {
      role: "scout",
      total_users: 5,
      active_30d: 4,
      active_pct: 80,
      avg_observations_month: 8,
      avg_session_min: 10,
    },
  ],
};

describe("usageStatistics.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchUsageOverview", () => {
    it("calls admin_usage_overview RPC with p_month", async () => {
      mockRpc.mockResolvedValue({ data: overviewPayload, error: null });

      await fetchUsageOverview("2025-02");

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith("admin_usage_overview", {
        p_month: "2025-02",
      });
    });

    it("calls admin_usage_overview with null when month not provided", async () => {
      mockRpc.mockResolvedValue({ data: overviewPayload, error: null });

      await fetchUsageOverview();

      expect(mockRpc).toHaveBeenCalledWith("admin_usage_overview", {
        p_month: null,
      });
    });

    it("returns data with mau, observations_month, records_month, by_role", async () => {
      mockRpc.mockResolvedValue({ data: overviewPayload, error: null });

      const result = await fetchUsageOverview();

      expect(result).toEqual(overviewPayload);
      expect(result).toHaveProperty("mau", 10);
      expect(result).toHaveProperty("observations_month", 42);
      expect(result).toHaveProperty("records_month", 15);
      expect(result).toHaveProperty("by_role");
      expect(Array.isArray(result.by_role)).toBe(true);
      expect(result.by_role[0]).toMatchObject({
        role: "scout",
        total_users: 5,
        avg_observations_month: 8,
      });
    });

    it("throws when RPC returns error", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "Forbidden" },
      });

      await expect(fetchUsageOverview()).rejects.toEqual({
        message: "Forbidden",
      });
    });
  });

  describe("fetchUsageUsers", () => {
    it("calls admin_usage_users with filters", async () => {
      const response = { data: [], total: 0 };
      mockRpc.mockResolvedValue({ data: response, error: null });

      await fetchUsageUsers({
        status: "active",
        role: "scout",
        sortBy: "activity",
        page: 1,
        perPage: 20,
      });

      expect(mockRpc).toHaveBeenCalledWith("admin_usage_users", {
        p_status: "active",
        p_role: "scout",
        p_sort_by: "activity",
        p_page: 1,
        p_per_page: 20,
      });
    });
  });

  describe("fetchUsageUserDetail", () => {
    it("calls admin_usage_user_detail with p_user_id", async () => {
      const detail = {
        user: {
          id: "u1",
          full_name: "Test",
          email: "t@t.com",
          business_role: "scout",
          last_login_at: null,
          login_count: 5,
        },
        avg_session_min: 10,
        logins_30d: 3,
        logins_per_week: 1,
        observations_30d: 2,
        players_30d: 1,
        pipeline_changes_30d: 0,
        last_logins: [],
      };
      mockRpc.mockResolvedValue({ data: detail, error: null });

      await fetchUsageUserDetail("u1");

      expect(mockRpc).toHaveBeenCalledWith("admin_usage_user_detail", {
        p_user_id: "u1",
      });
    });
  });

  describe("fetchLoginHistory", () => {
    it("calls admin_usage_login_history with params", async () => {
      const response = { data: [], total: 0 };
      mockRpc.mockResolvedValue({ data: response, error: null });

      await fetchLoginHistory({
        userId: "u1",
        dateFrom: "2025-02-01",
        dateTo: "2025-02-28",
        deviceType: "desktop",
        page: 1,
        perPage: 50,
      });

      expect(mockRpc).toHaveBeenCalledWith("admin_usage_login_history", {
        p_user_id: "u1",
        p_date_from: "2025-02-01",
        p_date_to: "2025-02-28",
        p_device_type: "desktop",
        p_page: 1,
        p_per_page: 50,
      });
    });
  });

  describe("fetchUsageTrends", () => {
    it("calls admin_usage_trends with date_from, date_to, granularity", async () => {
      const response = { series: [], top10: [] };
      mockRpc.mockResolvedValue({ data: response, error: null });

      await fetchUsageTrends({
        dateFrom: "2025-02-01",
        dateTo: "2025-02-28",
        granularity: "week",
      });

      expect(mockRpc).toHaveBeenCalledWith("admin_usage_trends", {
        p_date_from: "2025-02-01",
        p_date_to: "2025-02-28",
        p_granularity: "week",
      });
    });
  });
});
