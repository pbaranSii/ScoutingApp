import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { pl } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMonthlyBreakdown } from "../hooks/useUsageStatistics";
import { BUSINESS_ROLE_LABELS } from "@/features/users/types";
import type { BusinessRole } from "@/features/users/types";
import type { MonthlyBreakdownRow } from "../types";

const ROLE_BADGE: Record<string, string> = {
  scout: "bg-blue-100 text-blue-800",
  coach: "bg-orange-100 text-orange-800",
  director: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
};

function getDefaultRange() {
  const end = new Date();
  const start = subMonths(end, 11);
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(end, "yyyy-MM-dd"),
  };
}

export function RozliczeniaTab() {
  const [range, setRange] = useState(getDefaultRange);

  const { data, isLoading, error } = useMonthlyBreakdown(range.from, range.to);

  const { months, byUser } = useMemo(() => {
    if (!data?.data?.length) return { months: [] as string[], byUser: new Map<string, MonthlyBreakdownRow[]>() };
    const monthSet = new Set<string>();
    const userMap = new Map<string, MonthlyBreakdownRow[]>();
    for (const row of data.data) {
      monthSet.add(row.month);
      const list = userMap.get(row.user_id) ?? [];
      list.push(row);
      userMap.set(row.user_id, list);
    }
    const months = Array.from(monthSet).sort();
    for (const list of userMap.values()) {
      list.sort((a, b) => a.month.localeCompare(b.month));
    }
    return { months, byUser: userMap };
  }, [data?.data]);

  const users = useMemo(() => {
    if (!data?.data?.length) return [];
    const seen = new Map<string, MonthlyBreakdownRow>();
    for (const row of data.data) {
      if (!seen.has(row.user_id)) seen.set(row.user_id, row);
    }
    return Array.from(seen.values()).sort((a, b) =>
      (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
    );
  }, [data?.data]);

  const getCell = (userId: string, month: string) => {
    const list = byUser.get(userId) ?? [];
    const row = list.find((r) => r.month === month);
    if (!row) return { obs: 0, players: 0 };
    return { obs: row.observations_count, players: row.players_count };
  };

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - i);
  }, []);

  const setYear = (year: number) => {
    setRange({
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    });
  };

  const currentYear = new Date().getFullYear();
  const selectedYear = range.from ? parseInt(range.from.slice(0, 4), 10) : currentYear;

  return (
    <div className="space-y-4">
      <Card className="border-teal-200 bg-teal-50/30">
        <CardContent className="p-4">
          <p className="text-sm text-slate-700">
            Statystyki per użytkownik i per miesiąc: liczba dodanych obserwacji i zarejestrowanych zawodników.
            Przydatne do rozliczeń z pracownikami.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Rok:</span>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Nie udało się załadować danych rozliczeń.
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Ładowanie…
        </div>
      ) : !months.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Brak danych dla wybranego okresu.
        </div>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 font-semibold text-slate-800">
                  <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-100 px-3 py-2 text-left">
                    Użytkownik
                  </th>
                  <th className="border-b border-slate-200 px-2 py-2 text-left">Rola</th>
                  {months.map((m) => (
                    <th
                      key={m}
                      className="whitespace-nowrap border-b border-slate-200 px-2 py-2 text-center"
                      title={format(new Date(m + "-01"), "LLLL yyyy", { locale: pl })}
                    >
                      {format(new Date(m + "-01"), "MM.yy", { locale: pl })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-2">
                      <div className="font-medium text-slate-900">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[u.business_role] ?? "bg-slate-100 text-slate-800"}`}
                      >
                        {BUSINESS_ROLE_LABELS[u.business_role as BusinessRole]?.label ?? u.business_role}
                      </span>
                    </td>
                    {months.map((month) => {
                      const { obs, players } = getCell(u.user_id, month);
                      return (
                        <td
                          key={month}
                          className="border-b border-slate-100 px-2 py-2 text-center tabular-nums"
                        >
                          <div className="text-slate-800">{obs} obs.</div>
                          <div className="text-xs text-slate-500">{players} zaw.</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
