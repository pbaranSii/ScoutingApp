import { useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
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
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft } from "lucide-react";
import { useSurveyResults, useSurveyResponses } from "@/features/survey/hooks/useSurveyResults";
import { BUSINESS_ROLE_LABELS } from "@/features/users/types";
import type { BusinessRole } from "@/features/users/types";

const PERIOD_OPTIONS = [
  { value: "month", label: "Ostatni miesiąc" },
  { value: "quarter", label: "Ostatni kwartał" },
  { value: "year", label: "Ostatni rok" },
  { value: "all", label: "Wszystkie" },
];

const NPS_COLORS = { promoter: "#10B981", passive: "#F59E0B", detractor: "#EF4444" };

export function AdminSurveyResultsPage() {
  const [period, setPeriod] = useState("month");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [feedbackModal, setFeedbackModal] = useState<{
    full_name: string | null;
    user_role: string | null;
    submitted_at: string;
    csat_rating: number;
    ces_rating: number;
    nps_score: number;
    best_feature: string | null;
    feedback_text: string | null;
  } | null>(null);

  const { data: results, isLoading: resultsLoading } = useSurveyResults(period, role);
  const { data: responsesData, isLoading: responsesLoading } = useSurveyResponses(period, role, page, 50);

  const csatChartData = results?.csat_distribution
    ? Object.entries(results.csat_distribution)
        .map(([rating, count]) => ({ rating: `${rating} gw.`, count: Number(count), order: Number(rating) }))
        .sort((a, b) => b.order - a.order)
    : [];

  const npsChartData = results
    ? [
        { name: "Promoters (9-10)", value: results.promoters, color: NPS_COLORS.promoter },
        { name: "Passives (7-8)", value: results.passives, color: NPS_COLORS.passive },
        { name: "Detractors (0-6)", value: results.detractors, color: NPS_COLORS.detractor },
      ].filter((d) => d.value > 0)
    : [];

  const totalPages = responsesData?.total != null ? Math.ceil(responsesData.total / 50) : 0;

  return (
    <div className="space-y-6">
      <Link to="/settings">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Wstecz
        </Button>
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Ankiety satysfakcji</h1>
      <p className="text-sm text-slate-600">Wyniki ankiet i opinie użytkowników</p>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
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
      </div>

      {resultsLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 w-24 rounded bg-slate-200" />
                <div className="mt-2 h-8 w-16 rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>⭐</span> Ogólna satysfakcja (CSAT)
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums">
                  {results.csat_avg} <span className="text-base font-normal text-slate-600">/ 5.0</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {results.total} odpowiedzi · {PERIOD_OPTIONS.find((p) => p.value === period)?.label}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>🎯</span> Łatwość użycia (CES)
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums">
                  {results.ces_avg} <span className="text-base font-normal text-slate-600">/ 5.0</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{results.total} odpowiedzi</div>
              </CardContent>
            </Card>
            <Card
              className={
                results.nps_score >= 50
                  ? "border-green-200 bg-green-50/50"
                  : results.nps_score >= 30
                    ? "border-blue-200 bg-blue-50/50"
                    : results.nps_score >= 0
                      ? "border-yellow-200 bg-yellow-50/50"
                      : "border-red-200 bg-red-50/50"
              }
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span>📈</span> Net Promoter Score (NPS)
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums">
                  {results.nps_score >= 0 ? "+" : ""}
                  {results.nps_score}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Promoters: {results.promoters} · Passives: {results.passives} · Detractors: {results.detractors}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-800">Rozkład ocen satysfakcji (CSAT)</h4>
                {csatChartData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={csatChartData} layout="vertical" margin={{ left: 80 }}>
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="rating" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Brak danych</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-800">NPS — Breakdown</h4>
                {npsChartData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={npsChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {npsChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Brak danych</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Najpopularniejsze funkcje</h4>
              {results.best_feature_ranking?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 font-semibold text-slate-800">
                        <th className="border-b border-slate-200 px-4 py-2 text-left">#</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-left">Funkcja</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-right">Liczba</th>
                        <th className="border-b border-slate-200 px-4 py-2 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.best_feature_ranking.map((row: { feature: string; count: number }, i: number) => (
                        <tr key={row.feature} className="hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-4 py-2">{i + 1}</td>
                          <td className="border-b border-slate-100 px-4 py-2">{row.feature}</td>
                          <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">{row.count}</td>
                          <td className="border-b border-slate-100 px-4 py-2 text-right tabular-nums">
                            {results.total > 0 ? ((row.count / results.total) * 100).toFixed(0) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Brak danych</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardContent className="pt-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-800">Odpowiedzi użytkowników (ostatnie 50)</h4>
          {responsesLoading ? (
            <p className="text-sm text-slate-500">Ładowanie…</p>
          ) : !responsesData?.data?.length ? (
            <p className="text-sm text-slate-500">Brak odpowiedzi.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <th className="border-b border-slate-200 px-4 py-2 text-left">Użytkownik</th>
                      <th className="border-b border-slate-200 px-4 py-2 text-left">Rola</th>
                      <th className="border-b border-slate-200 px-4 py-2 text-left">Data</th>
                      <th className="border-b border-slate-200 px-4 py-2 text-left">CSAT</th>
                      <th className="border-b border-slate-200 px-4 py-2 text-left">CES</th>
                      <th className="border-b border-slate-200 px-4 py-2 text-left">NPS</th>
                      <th className="border-b border-slate-200 px-4 py-2 text-left">Funkcja</th>
                      <th className="border-b border-slate-200 px-4 py-2 text-left">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responsesData.data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-4 py-2">{row.full_name ?? "—"}</td>
                        <td className="border-b border-slate-100 px-4 py-2">
                          {BUSINESS_ROLE_LABELS[row.user_role as BusinessRole]?.label ?? row.user_role ?? "—"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-2 tabular-nums">
                          {format(new Date(row.submitted_at), "yyyy-MM-dd HH:mm")}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-2">{row.csat_rating}/5</td>
                        <td className="border-b border-slate-100 px-4 py-2">{row.ces_rating}/5</td>
                        <td className="border-b border-slate-100 px-4 py-2">
                          <span
                            className={
                              row.nps_score >= 9
                                ? "text-green-600"
                                : row.nps_score >= 7
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {row.nps_score}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-2">{row.best_feature ?? "—"}</td>
                        <td className="border-b border-slate-100 px-4 py-2 max-w-[200px]">
                          {row.feedback_text ? (
                            <button
                              type="button"
                              className="cursor-pointer truncate text-left text-primary underline hover:no-underline"
                              onClick={() =>
                                setFeedbackModal({
                                  full_name: row.full_name,
                                  user_role: row.user_role,
                                  submitted_at: row.submitted_at,
                                  csat_rating: row.csat_rating,
                                  ces_rating: row.ces_rating,
                                  nps_score: row.nps_score,
                                  best_feature: row.best_feature,
                                  feedback_text: row.feedback_text,
                                })
                              }
                            >
                              {row.feedback_text.length > 50 ? `${row.feedback_text.slice(0, 50)}…` : row.feedback_text}
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Poprzednia
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Następna
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(feedbackModal)} onOpenChange={(open) => !open && setFeedbackModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Feedback od: {feedbackModal?.full_name ?? "—"} (
              {feedbackModal?.user_role ? BUSINESS_ROLE_LABELS[feedbackModal.user_role as BusinessRole]?.label : "—"})
            </DialogTitle>
          </DialogHeader>
          {feedbackModal && (
            <div className="space-y-3 text-sm">
              <p className="text-slate-500">
                Data: {format(new Date(feedbackModal.submitted_at), "yyyy-MM-dd HH:mm")}
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="whitespace-pre-wrap text-slate-800">{feedbackModal.feedback_text ?? "—"}</p>
              </div>
              <p className="text-slate-600">
                CSAT: {feedbackModal.csat_rating}/5 · CES: {feedbackModal.ces_rating}/5 · NPS:{" "}
                {feedbackModal.nps_score}/10 · Najlepsza funkcja: {feedbackModal.best_feature ?? "—"}
              </p>
              <Button variant="outline" onClick={() => setFeedbackModal(null)}>
                Zamknij
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
