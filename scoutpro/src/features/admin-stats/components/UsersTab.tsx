import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsageUserDetail, useUsageUsers } from "../hooks/useUsageStatistics";
import type { UsageUsersFilters } from "../types";
import { BUSINESS_ROLE_LABELS } from "@/features/users/types";
import type { BusinessRole } from "@/features/users/types";

const ROLE_BADGE_CLASS: Record<string, string> = {
  scout: "bg-blue-100 text-blue-800",
  coach: "bg-orange-100 text-orange-800",
  director: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-800",
};

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function UsersTab() {
  const [filters, setFilters] = useState<UsageUsersFilters>({
    status: "all",
    role: "all",
    sortBy: "activity",
    page: 1,
    perPage: 20,
  });
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const { data, isLoading, error } = useUsageUsers(filters);
  const { data: detail, isLoading: detailLoading } = useUsageUserDetail(detailUserId);

  const hasActiveFilters = filters.status !== "all" || filters.role !== "all" || filters.sortBy !== "activity";

  const resetFilters = () => {
    setFilters((f) => ({
      ...f,
      status: "all",
      role: "all",
      sortBy: "activity",
      page: 1,
    }));
  };

  const totalPages = data?.total != null ? Math.ceil(data.total / filters.perPage) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.status}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v as "all" | "active" | "inactive", page: 1 }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy</SelectItem>
            <SelectItem value="active">Aktywni</SelectItem>
            <SelectItem value="inactive">Nieaktywni</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.role}
          onValueChange={(v) => setFilters((f) => ({ ...f, role: v, page: 1 }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rola" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {(["scout", "coach", "director", "admin"] as const).map((r) => (
              <SelectItem key={r} value={r}>
                {BUSINESS_ROLE_LABELS[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.sortBy}
          onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v as "activity" | "last_login" | "name", page: 1 }))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sortuj" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activity">Aktywność (malejąco)</SelectItem>
            <SelectItem value="last_login">Ostatnie logowanie</SelectItem>
            <SelectItem value="name">Imię A–Z</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset filtrów
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Nie udało się załadować listy użytkowników.
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Ładowanie…
        </div>
      ) : !data?.data?.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Brak użytkowników do wyświetlenia.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 font-semibold text-slate-800">
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Użytkownik</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Rola</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Status</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-left">Ostatnie logowanie</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-right">Logowania</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-right">Obserwacje (mies.)</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-right">Czas sesji</th>
                    <th className="border-b border-slate-200 px-4 py-2 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-4 py-2">
                        <div className="font-medium text-slate-900">{row.full_name ?? "—"}</div>
                        <div className="text-xs text-slate-500">{row.email}</div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[row.business_role] ?? "bg-slate-100"}`}>
                          {BUSINESS_ROLE_LABELS[row.business_role as BusinessRole]?.label ?? row.business_role}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-2">
                        <span className={row.is_active_30d ? "text-green-600" : "text-slate-500"}>
                          {row.is_active_30d ? "Aktywny" : "Nieaktywny"}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-2">
                        {row.last_login_at ? (
                          <>
                            <div className="tabular-nums">{format(new Date(row.last_login_at), "yyyy-MM-dd HH:mm")}</div>
                            <div className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(row.last_login_at), { addSuffix: true, locale: pl })}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{row.login_count}</td>
                      <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{row.observations_month}</td>
                      <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{row.avg_session_min} min</td>
                      <td className="border-b border-slate-100 px-4 py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDetailUserId(row.id)}>
                          Szczegóły
                        </Button>
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

      <Dialog open={Boolean(detailUserId)} onOpenChange={(open) => !open && setDetailUserId(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Szczegóły użytkownika{detail ? `: ${detail.user?.full_name ?? detail.user?.email}` : ""}
            </DialogTitle>
          </DialogHeader>
          {detailUserId && (
            <>
              {detailLoading ? (
                <p className="text-sm text-slate-500">Ładowanie…</p>
              ) : detail ? (
                <div className="space-y-4 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h4 className="font-semibold text-slate-800">Podsumowanie aktywności</h4>
                    <ul className="mt-2 space-y-1 text-slate-700">
                      <li>
                        Ostatnie logowanie:{" "}
                        {detail.user?.last_login_at
                          ? `${format(new Date(detail.user.last_login_at), "yyyy-MM-dd HH:mm")} (${formatDistanceToNow(new Date(detail.user.last_login_at), { addSuffix: true, locale: pl })})`
                          : "—"}
                      </li>
                      <li>Liczba logowań (total): {detail.user?.login_count ?? 0}</li>
                      <li>Średni czas sesji: {detail.avg_session_min} min</li>
                      <li>Częstotliwość logowania: {detail.logins_per_week}× / tydzień</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h4 className="font-semibold text-slate-800">Utworzone rekordy (ostatnie 30 dni)</h4>
                    <ul className="mt-2 space-y-1 text-slate-700">
                      <li>Obserwacje: {detail.observations_30d}</li>
                      <li>Zawodnicy: {detail.players_30d}</li>
                      <li>Zmiany statusów: {detail.pipeline_changes_30d}</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h4 className="font-semibold text-slate-800">Ostatnie 10 logowań</h4>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left font-medium text-slate-600">
                            <th className="py-1">Data</th>
                            <th className="py-1">Czas sesji</th>
                            <th className="py-1">Urządzenie</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.last_logins?.map((s) => (
                            <tr key={s.id}>
                              <td className="py-1 tabular-nums">{format(new Date(s.started_at), "yyyy-MM-dd HH:mm")}</td>
                              <td className="py-1">{s.duration_seconds != null ? `${Math.round(s.duration_seconds / 60)} min` : "—"}</td>
                              <td className="py-1">{s.device_type ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setDetailUserId(null)}>
                    Zamknij
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Brak danych.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
