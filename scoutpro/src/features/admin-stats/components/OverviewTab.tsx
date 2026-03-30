import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { useUsageOverview } from "../hooks/useUsageStatistics";
import { BUSINESS_ROLE_LABELS } from "@/features/users/types";
import type { BusinessRole } from "@/features/users/types";

const ROLE_BADGE_CLASS: Record<string, string> = {
  scout: "bg-blue-100 text-blue-800",
  coach: "bg-orange-100 text-orange-800",
  director: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-800",
};

export function OverviewTab() {
  const { data, isLoading, error } = useUsageOverview();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 w-24 rounded bg-slate-200" />
              <div className="mt-2 h-10 w-16 rounded bg-slate-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    const msg =
      (error as { message?: string })?.message ?? "";
    const is400 = typeof msg === "string" && (msg.includes("400") || msg.includes("Bad Request"));
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-red-600">
        Nie udało się załadować podsumowania.
        {is400 && (
          <p className="mt-2 text-xs text-slate-600">
            Błąd 400 zwykle oznacza, że na bazie nie została zastosowana migracja korygująca RPC statystyk. Zobacz{" "}
            <code className="rounded bg-slate-100 px-1">supabase/APPLY_ADMIN_STATS_SURVEY.md</code> – sekcja „Błąd 400 przy Statystyki użytkowników”.
          </p>
        )}
      </div>
    );
  }

  const mauTrend = data.mau_prev != null ? data.mau - data.mau_prev : null;
  const avgObs = data.active_users_count_30d > 0
    ? (data.observations_month / data.active_users_count_30d).toFixed(1)
    : "0";

  const kpiCards = [
    {
      title: "Aktywni użytkownicy",
      value: data.mau,
      unit: "użytkowników",
      sub: "Ostatnie 30 dni",
      trend: mauTrend != null ? `${mauTrend >= 0 ? "+" : ""}${mauTrend} vs poprzedni miesiąc` : null,
      trendUp: mauTrend != null ? mauTrend >= 0 : null,
      icon: "👥",
      className: "border-blue-200 bg-blue-50/50",
    },
    {
      title: "Obserwacje w tym miesiącu",
      value: data.observations_month,
      unit: "obserwacji",
      sub: `Średnio ${avgObs} na użytkownika`,
      icon: "📝",
      className: "border-green-200 bg-green-50/50",
    },
    {
      title: "Średni czas w aplikacji",
      value: data.avg_session_minutes.toFixed(1),
      unit: "minut",
      sub: "Na sesję",
      icon: "⏱️",
      className: "border-orange-200 bg-orange-50/50",
    },
    {
      title: "Nowi użytkownicy",
      value: data.new_users_month,
      unit: "użytkowników",
      sub: "Dodanych w tym miesiącu",
      icon: "✨",
      className: "border-purple-200 bg-purple-50/50",
    },
    {
      title: "Utworzone rekordy",
      value: data.records_month,
      unit: "rekordów",
      sub: "Obserwacje + Zawodnicy + Pipeline",
      icon: "📊",
      className: "border-teal-200 bg-teal-50/50",
    },
    {
      title: "Ostatnia aktywność",
      value: data.last_activity?.full_name ?? "—",
      sub: data.last_activity
        ? `Logowanie · ${formatDistanceToNow(new Date(data.last_activity.started_at), { addSuffix: true, locale: pl })}`
        : "Brak danych",
      icon: "🕐",
      className: "border-gray-200 bg-gray-50/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((card) => (
          <Card key={card.title} className={`${card.className} border`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span>{card.icon}</span>
                {card.title}
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900 md:text-4xl">
                {card.value}
              </div>
              {typeof card.value === "number" && card.unit && (
                <div className="text-sm text-slate-600">{card.unit}</div>
              )}
              <div className="mt-1 text-xs text-slate-500">{card.sub}</div>
              {card.trend != null && (
                <div
                  className={`mt-1 text-xs font-medium ${card.trendUp ? "text-green-600" : "text-red-600"}`}
                >
                  {card.trend}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Aktywność według roli</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 font-semibold text-slate-800">
                <th className="border-b border-slate-200 px-4 py-2 text-left">Rola</th>
                <th className="border-b border-slate-200 px-4 py-2 text-right">Liczba użytkowników</th>
                <th className="border-b border-slate-200 px-4 py-2 text-right">Aktywni (30 dni)</th>
                <th className="border-b border-slate-200 px-4 py-2 text-right">Średnio obserwacji</th>
                <th className="border-b border-slate-200 px-4 py-2 text-right">Średnio czas sesji</th>
              </tr>
            </thead>
            <tbody>
              {data.by_role?.map((row: { role: string; total_users: number; active_30d: number; active_pct: number; avg_observations_month: number; avg_session_min: number }) => {
                const roleLabel = BUSINESS_ROLE_LABELS[row.role as BusinessRole]?.label ?? row.role;
                const pctClass =
                  row.active_pct >= 80 ? "text-green-600" : row.active_pct >= 60 ? "text-yellow-600" : "text-red-600";
                return (
                  <tr key={row.role} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[row.role] ?? "bg-slate-100 text-slate-800"}`}>
                        {roleLabel}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{row.total_users}</td>
                    <td className={`border-b border-slate-100 px-4 py-2 text-right tabular-nums ${pctClass}`}>
                      {row.active_30d} ({row.active_pct}%)
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{row.avg_observations_month}</td>
                    <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{row.avg_session_min} min</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
