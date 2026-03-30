import { useState } from "react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLoginHistory } from "../hooks/useUsageStatistics";
import { useUsers } from "@/features/users/hooks/useUsers";
import type { LoginHistoryFilters } from "../types";
import { BUSINESS_ROLE_LABELS } from "@/features/users/types";
import type { BusinessRole } from "@/features/users/types";

const PER_PAGE_OPTIONS = [20, 50, 100, 200];

function escapeCsv(s: string | null | undefined): string {
  if (s == null) return "";
  const t = String(s);
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export function ActivityTab() {
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultFrom = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const [filters, setFilters] = useState<LoginHistoryFilters>({
    userId: null,
    dateFrom: defaultFrom,
    dateTo: today,
    deviceType: null,
    page: 1,
    perPage: 50,
  });

  const { data: usersData } = useUsers();
  const users = usersData ?? [];
  const { data, isLoading, error } = useLoginHistory(filters);

  const totalPages = data?.total != null ? Math.ceil(data.total / filters.perPage) : 0;

  const handleExportCsv = async () => {
    if (!data?.data?.length) return;
    const headers = ["Data i godzina", "Użytkownik", "Rola", "Urządzenie", "Przeglądarka", "IP", "Czas sesji (min)"];
    const rows = data.data.map((r) => [
      r.started_at ? format(new Date(r.started_at), "yyyy-MM-dd HH:mm:ss") : "",
      escapeCsv(r.full_name),
      escapeCsv(BUSINESS_ROLE_LABELS[r.business_role as BusinessRole]?.label ?? r.business_role),
      escapeCsv(r.device_type),
      escapeCsv(r.browser),
      escapeCsv(r.ip_address),
      r.duration_seconds != null ? String(Math.round(r.duration_seconds / 60)) : r.ended_at == null ? "Aktywna" : "",
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historia-logowan-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.userId ?? "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, userId: v === "all" ? null : v, page: 1 }))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Użytkownik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name ?? u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
          className="w-[140px]"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
          className="w-[140px]"
        />
        <Select
          value={filters.deviceType ?? "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, deviceType: v === "all" ? null : v, page: 1 }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Urządzenie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!data?.data?.length}>
          Export CSV
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Nie udało się załadować historii logowań.
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Ładowanie…
        </div>
      ) : !data?.data?.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Brak logowań dla wybranych kryteriów.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 font-semibold text-slate-800">
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Data i godzina</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Użytkownik</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Rola</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Urządzenie</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Przeglądarka</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">IP</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-right">Czas sesji</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-4 py-2 tabular-nums">
                        {row.started_at ? format(new Date(row.started_at), "yyyy-MM-dd HH:mm:ss") : "—"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-2">{row.full_name ?? "—"}</td>
                      <td className="border-b border-slate-100 px-4 py-2">
                        {BUSINESS_ROLE_LABELS[row.business_role as BusinessRole]?.label ?? row.business_role}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-2">{row.device_type ?? "—"}</td>
                      <td className="border-b border-slate-100 px-4 py-2">{row.browser ?? "—"}</td>
                      <td className="border-b border-slate-100 px-4 py-2">{row.ip_address ?? "—"}</td>
                      <td className="border-b border-slate-100 px-4 py-2 text-right">
                        {row.ended_at == null
                          ? "Aktywna"
                          : row.duration_seconds != null
                            ? `${Math.round(row.duration_seconds / 60)} min`
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Na stronę:</span>
                <Select
                  value={String(filters.perPage)}
                  onValueChange={(v) => setFilters((f) => ({ ...f, perPage: Number(v), page: 1 }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PER_PAGE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="tabular-nums">Razem: {data.total}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Poprzednia
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Następna
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
