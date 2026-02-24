import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUsageTrends } from "../hooks/useUsageStatistics";
import type { TrendsFilters } from "../types";

const MEDAL = ["🥇", "🥈", "🥉"];

export function TrendsTab() {
  const today = new Date();
  const defaultTo = format(today, "yyyy-MM-dd");
  const defaultFrom = format(subDays(today, 90), "yyyy-MM-dd");
  const [filters, setFilters] = useState<TrendsFilters>({
    dateFrom: defaultFrom,
    dateTo: defaultTo,
    granularity: "week",
  });

  const { data, isLoading, error } = useUsageTrends(filters);

  const chartData = useMemo(() => {
    if (!data?.series?.length) return [];
    return data.series.map((p) => ({
      ...p,
      bucketLabel: format(new Date(p.bucket), "dd.MM.yy"),
    }));
  }, [data?.series]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          className="w-[140px]"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          className="w-[140px]"
        />
        <select
          value={filters.granularity}
          onChange={(e) => setFilters((f) => ({ ...f, granularity: e.target.value as "day" | "week" | "month" }))}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="day">Dzień</option>
          <option value="week">Tydzień</option>
          <option value="month">Miesiąc</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Nie udało się załadować trendów.
        </div>
      )}

      {isLoading ? (
        <div className="h-80 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500">
          Ładowanie…
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="pt-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Aktywni użytkownicy (logowania)</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [value ?? 0, "Aktywni"]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="active_users"
                      name="Aktywni użytkownicy"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Liczba utworzonych obserwacji</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [value ?? 0, "Obserwacje"]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="observations_count"
                      name="Obserwacje"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Średni czas sesji (min)</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [`${value ?? 0} min`, "Średni czas"]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_session_min"
                      name="Średni czas (min)"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">
                Top 10 najbardziej aktywnych użytkowników (ostatnie 30 dni)
              </h4>
              {data?.top10?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 font-semibold text-slate-800">
                        <th className="border-b border-slate-200 px-4 py-2 text-left">#</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-left">Użytkownik</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-right">Logowania</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-right">Obserwacje</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-right">Czas</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-right">Punkty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top10.map((u, i) => (
                        <tr key={u.user_id} className="hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-4 py-2">
                            {i < 3 ? MEDAL[i] : ""} #{i + 1}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-2 font-medium">{u.full_name ?? "—"}</td>
                          <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{u.logins_30d}</td>
                          <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{u.observations_30d}</td>
                          <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{u.total_hours}h</td>
                          <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{u.activity_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Brak danych.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
