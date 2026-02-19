import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useClubs } from "@/features/players/hooks/usePlayers";
import { useScouts } from "@/features/users/hooks/useUsers";
import { PIPELINE_STATUS_COLORS } from "@/features/pipeline/types";
import { AGE_CATEGORY_FILTER_OPTIONS } from "@/features/pipeline/utils/ageCategory";
import { POSITION_OPTIONS } from "@/features/players/positions";
import {
  useAnalyticsPlayerList,
  useComparisons,
  useHeatmap,
  usePipelineMetrics,
  usePipelineMetricsEnabled,
  useSankey,
  useTrends,
} from "@/features/analytics/hooks/useRecruitmentAnalytics";
import type { RecruitmentAnalyticsDateRange, RecruitmentAnalyticsFilters } from "@/features/analytics/types";
import { SankeyDiagram } from "@/features/analytics/components/SankeyDiagram";
import { TrendsChart } from "@/features/analytics/components/TrendsChart";
import { ComparisonsChart } from "@/features/analytics/components/ComparisonsChart";
import { HeatmapTable } from "@/features/analytics/components/HeatmapTable";
import { GaugesPanel } from "@/features/analytics/components/GaugesPanel";
import { exportElementAsPdf, exportElementAsPng, toCsv, downloadText } from "@/features/analytics/utils/export";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";

const LS_KEY = "recruitment-analytics:filters:v1";

type StoredState = {
  range: RecruitmentAnalyticsDateRange;
  filters: RecruitmentAnalyticsFilters;
};

function defaultState(): StoredState {
  const today = new Date();
  const dateTo = format(today, "yyyy-MM-dd");
  const dateFrom = format(subDays(today, 365), "yyyy-MM-dd");
  return {
    range: { dateFrom, dateTo },
    filters: {
      scoutIds: [],
      clubIds: [],
      regionIds: [],
      birthYears: [],
      positions: [],
      sources: [],
      ranks: [],
    },
  };
}

function safeParseState(raw: string | null): StoredState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed?.range?.dateFrom || !parsed?.range?.dateTo || !parsed?.filters) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Klasy Tailwind dla wypełnienia pasków lejka – zgodne z obramowaniem górnym stosów w Pipeline (PIPELINE_STATUS_COLORS.dot). */
const FUNNEL_STAGE_BAR_CLASS: Record<string, string> = {
  first_contact: PIPELINE_STATUS_COLORS.unassigned.dot,
  observed: PIPELINE_STATUS_COLORS.observed.dot,
  shortlist: PIPELINE_STATUS_COLORS.shortlist.dot,
  trial: PIPELINE_STATUS_COLORS.trial.dot,
  offer: PIPELINE_STATUS_COLORS.offer.dot,
  signed: PIPELINE_STATUS_COLORS.signed.dot,
  rejected: PIPELINE_STATUS_COLORS.rejected.dot,
};

function FunnelStageRow(props: {
  label: string;
  stageKey: string;
  count: number;
  prevCount: number | null;
  totalForPercent?: number;
  onClick?: () => void;
}) {
  const { count, prevCount, totalForPercent = 0 } = props;
  const conversion = prevCount != null && prevCount > 0 ? (count / prevCount) * 100 : null;
  const drop = conversion !== null ? 100 - conversion : null;
  const barFillClass = FUNNEL_STAGE_BAR_CLASS[props.stageKey] ?? "bg-slate-500";
  const barConversionPct = conversion !== null ? conversion : 100;

  return (
    <button
      type="button"
      onClick={props.onClick}
      className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{props.label}</div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="tabular-nums font-medium text-slate-700">{count}</span>
              {totalForPercent > 0 && (
                <span className="tabular-nums">
                  ({totalForPercent > 0 ? ((count / totalForPercent) * 100).toFixed(1) : "0"}% z total)
                </span>
              )}
              {conversion !== null && (
                <span className="tabular-nums text-slate-600">
                  {conversion.toFixed(1)}% ↓ -{drop?.toFixed(1) ?? 0}%
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums text-slate-900">{count}</div>
          </div>
        </div>
        <div className="h-6 w-full overflow-hidden rounded bg-slate-100">
          <div
            className={`h-full rounded transition-all ${barFillClass}`}
            style={{ width: `${Math.min(100, barConversionPct)}%` }}
          />
        </div>
      </div>
    </button>
  );
}

const GRANULARITY_OPTIONS = ["day", "week", "month", "quarter"] as const;
function isGranularity(v: string): v is (typeof GRANULARITY_OPTIONS)[number] {
  return (GRANULARITY_OPTIONS as readonly string[]).includes(v);
}

const COMPARISON_OPTIONS = ["scouts", "regions", "positions", "sources", "ages"] as const;
function isComparisonType(v: string): v is (typeof COMPARISON_OPTIONS)[number] {
  return (COMPARISON_OPTIONS as readonly string[]).includes(v);
}

export function RecruitmentAnalyticsPage() {
  const { user } = useAuthStore();
  const { data: clubs = [] } = useClubs();
  const { data: scouts = [] } = useScouts();

  const [draft, setDraft] = useState<StoredState>(
    () => safeParseState(localStorage.getItem(LS_KEY)) ?? defaultState()
  );
  const [applied, setApplied] = useState<StoredState>(draft);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  }, [draft]);

  const activeFiltersCount = useMemo(() => {
    const f = draft.filters;
    const count =
      (f.scoutIds.length ? 1 : 0) +
      (f.clubIds.length ? 1 : 0) +
      (f.regionIds.length ? 1 : 0) +
      (f.birthYears.length ? 1 : 0) +
      (f.positions.length ? 1 : 0) +
      (f.sources.length ? 1 : 0) +
      (f.ranks.length ? 1 : 0);
    return count;
  }, [draft.filters]);

  const metricsQuery = usePipelineMetrics(applied.range, applied.filters);

  const [compareEnabled, setCompareEnabled] = useState(false);
  const compareRange = useMemo<RecruitmentAnalyticsDateRange | null>(() => {
    if (!compareEnabled) return null;
    const from = parseISO(applied.range.dateFrom);
    const to = parseISO(applied.range.dateTo);
    const length = Math.max(1, differenceInCalendarDays(to, from) + 1);
    const prevTo = subDays(from, 1);
    const prevFrom = subDays(prevTo, length - 1);
    return {
      dateFrom: format(prevFrom, "yyyy-MM-dd"),
      dateTo: format(prevTo, "yyyy-MM-dd"),
    };
  }, [applied.range.dateFrom, applied.range.dateTo, compareEnabled]);

  const compareMetricsQuery = usePipelineMetricsEnabled(
    compareRange ?? applied.range,
    applied.filters,
    Boolean(compareRange)
  );

  const [activeTab, setActiveTab] = useState<
    "funnel" | "sankey" | "trends" | "comparisons" | "heatmap" | "gauges"
  >("funnel");
  const [trendsGranularity, setTrendsGranularity] = useState<"day" | "week" | "month" | "quarter">("week");
  const [comparisonType, setComparisonType] = useState<"scouts" | "regions" | "positions" | "sources" | "ages">("scouts");

  const sankeyQuery = useSankey(applied.range, applied.filters, activeTab === "sankey");
  const trendsQuery = useTrends(applied.range, applied.filters, trendsGranularity, activeTab === "trends");
  const comparisonsQuery = useComparisons(applied.range, applied.filters, comparisonType, activeTab === "comparisons");
  const heatmapQuery = useHeatmap(applied.range, applied.filters, activeTab === "heatmap");

  const [playerListOpen, setPlayerListOpen] = useState(false);
  const [playerListStatus, setPlayerListStatus] = useState<
    "first_contact" | "observed" | "shortlist" | "trial" | "offer" | "signed" | "rejected"
  >("first_contact");
  const [playerListPage, setPlayerListPage] = useState(1);

  const playerListQuery = useAnalyticsPlayerList({
    status: playerListStatus,
    range: applied.range,
    filters: applied.filters,
    page: playerListPage,
    limit: 20,
    enabled: playerListOpen,
  });

  const openPlayerList = (status: typeof playerListStatus) => {
    setPlayerListStatus(status);
    setPlayerListPage(1);
    setPlayerListOpen(true);
  };

  const funnel = metricsQuery.data?.funnel;
  const exportRef = useRef<HTMLDivElement | null>(null);

  const exportBaseName = `${applied.range.dateFrom}_${applied.range.dateTo}`;

  const onExportCsv = () => {
    if (!metricsQuery.data) return;
    const m = metricsQuery.data;
    const rows = [
      {
        metric: "date_from",
        value: applied.range.dateFrom,
      },
      { metric: "date_to", value: applied.range.dateTo },
      { metric: "total_candidates", value: m.kpi.totalCandidates },
      { metric: "conversion_rate_pct", value: m.kpi.conversionRate },
      { metric: "time_to_hire_days_avg", value: m.kpi.timeToHireDaysAvg },
      { metric: "active_trials", value: m.kpi.activeTrials },
      { metric: "funnel_first_contact", value: m.funnel.first_contact },
      { metric: "funnel_observed", value: m.funnel.observed },
      { metric: "funnel_shortlist", value: m.funnel.shortlist },
      { metric: "funnel_trial", value: m.funnel.trial },
      { metric: "funnel_offer", value: m.funnel.offer },
      { metric: "funnel_signed", value: m.funnel.signed },
      { metric: "funnel_rejected", value: m.funnel.rejected },
    ];
    const csv = toCsv(rows);
    downloadText(`recruitment-analytics_${exportBaseName}.csv`, csv);
  };

  const onExportPng = async () => {
    try {
      if (!exportRef.current) return;
      await exportElementAsPng(exportRef.current, `recruitment-analytics_${exportBaseName}.png`);
    } catch {
      toast({ title: "Export PNG nieudany", description: "Nie udało się wygenerować obrazu.", variant: "destructive" });
    }
  };

  const onExportPdf = async () => {
    try {
      if (!exportRef.current) return;
      await exportElementAsPdf(exportRef.current, `recruitment-analytics_${exportBaseName}.pdf`);
    } catch {
      toast({ title: "Export PDF nieudany", description: "Nie udało się wygenerować PDF.", variant: "destructive" });
    }
  };

  const deltas = useMemo(() => {
    if (!compareEnabled || !metricsQuery.data || !compareMetricsQuery.data) return null;
    const curr = metricsQuery.data.kpi;
    const prev = compareMetricsQuery.data.kpi;
    const pct = (a: number, b: number) => (b !== 0 ? ((a - b) / b) * 100 : null);
    return {
      totalCandidates: pct(curr.totalCandidates, prev.totalCandidates),
      conversionRate: pct(curr.conversionRate, prev.conversionRate),
      timeToHireDaysAvg: pct(curr.timeToHireDaysAvg, prev.timeToHireDaysAvg),
      activeTrials: pct(curr.activeTrials, prev.activeTrials),
    };
  }, [compareEnabled, metricsQuery.data, compareMetricsQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment Analytics" subtitle="Metryki i lejek rekrutacji." />

      <div className="sticky top-0 z-20 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Od</label>
              <Input
                type="date"
                value={draft.range.dateFrom}
                onChange={(e) =>
                  setDraft((s) => ({ ...s, range: { ...s.range, dateFrom: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Do</label>
              <Input
                type="date"
                value={draft.range.dateTo}
                onChange={(e) =>
                  setDraft((s) => ({ ...s, range: { ...s.range, dateTo: e.target.value } }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Scout</label>
              <Select
                value={draft.filters.scoutIds[0] ?? "all"}
                onValueChange={(v) =>
                  setDraft((s) => ({
                    ...s,
                    filters: { ...s.filters, scoutIds: v === "all" ? [] : [v] },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszyscy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy</SelectItem>
                  {scouts.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id}>
                      {sc.full_name?.trim() || sc.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Klub</label>
              <Select
                value={draft.filters.clubIds[0] ?? "all"}
                onValueChange={(v) =>
                  setDraft((s) => ({
                    ...s,
                    filters: { ...s.filters, clubIds: v === "all" ? [] : [v] },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Kategoria (rok)</label>
              <Select
                value={draft.filters.birthYears[0] ? String(draft.filters.birthYears[0]) : "all"}
                onValueChange={(v) =>
                  setDraft((s) => ({
                    ...s,
                    filters: { ...s.filters, birthYears: v === "all" ? [] : [Number(v)] },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {AGE_CATEGORY_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Pozycja</label>
              <Select
                value={draft.filters.positions[0] ?? "all"}
                onValueChange={(v) =>
                  setDraft((s) => ({
                    ...s,
                    filters: { ...s.filters, positions: v === "all" ? [] : [v] },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {POSITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.code} value={opt.code}>
                      {opt.label} ({opt.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFiltersCount > 0 && (
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {activeFiltersCount} aktywne filtry
              </div>
            )}
            <label className="hidden lg:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={compareEnabled}
                onChange={(e) => setCompareEnabled(e.target.checked)}
              />
              Porównaj okres
            </label>
            <Button
              variant="outline"
              onClick={() => {
                const s = defaultState();
                setDraft(s);
                setApplied(s);
              }}
            >
              Reset
            </Button>
            <Button onClick={() => setApplied(draft)} disabled={metricsQuery.isFetching}>
              Zastosuj
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="hidden lg:inline-flex" variant="outline">
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportCsv}>CSV (podsumowanie)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void onExportPng()}>PNG</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void onExportPdf()}>PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {metricsQuery.isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Ładowanie metryk…
        </div>
      )}
      {metricsQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Nie udało się pobrać danych Analytics.
        </div>
      )}

      {metricsQuery.data && (
        <>
        {/* Mobile simplified layout */}
        <div className="space-y-4 lg:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-9 px-3 text-xs"
              onClick={() =>
                setDraft((s) => ({
                  ...s,
                  filters: { ...s.filters, scoutIds: [], birthYears: [] },
                }))
              }
            >
              Wszystkie
            </Button>
            <Button
              variant="outline"
              className="h-9 px-3 text-xs"
              onClick={() => {
                const y = new Date().getFullYear();
                setDraft((s) => ({ ...s, filters: { ...s.filters, birthYears: [y - 14, y - 15, y - 16] } }));
              }}
            >
              U14–U16
            </Button>
            <Button
              variant="outline"
              className="h-9 px-3 text-xs"
              onClick={() => {
                if (!user?.id) return;
                setDraft((s) => ({ ...s, filters: { ...s.filters, scoutIds: [user.id] } }));
              }}
            >
              Moje obserwacje
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <Card className="min-w-[220px]">
              <CardHeader>
                <CardTitle>Kandydaci</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.totalCandidates}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[220px]">
              <CardHeader>
                <CardTitle>Konwersja</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.conversionRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[220px]">
              <CardHeader>
                <CardTitle>Time-to-hire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.timeToHireDaysAvg.toFixed(1)}d
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[220px]">
              <CardHeader>
                <CardTitle>Testy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.activeTrials}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Mini Funnel</div>
            <div className="grid gap-2">
              {funnel && (
                <>
                  <FunnelStageRow label="First Contact" stageKey="first_contact" count={funnel.first_contact} prevCount={null} totalForPercent={funnel.first_contact} onClick={() => openPlayerList("first_contact")} />
                  <FunnelStageRow label="Observed" stageKey="observed" count={funnel.observed} prevCount={funnel.first_contact} totalForPercent={funnel.first_contact} onClick={() => openPlayerList("observed")} />
                  <FunnelStageRow label="Shortlist" stageKey="shortlist" count={funnel.shortlist} prevCount={funnel.observed} totalForPercent={funnel.first_contact} onClick={() => openPlayerList("shortlist")} />
                  <FunnelStageRow label="Trial" stageKey="trial" count={funnel.trial} prevCount={funnel.shortlist} totalForPercent={funnel.first_contact} onClick={() => openPlayerList("trial")} />
                  <FunnelStageRow label="Offer" stageKey="offer" count={funnel.offer} prevCount={funnel.trial} totalForPercent={funnel.first_contact} onClick={() => openPlayerList("offer")} />
                  <FunnelStageRow label="Signed" stageKey="signed" count={funnel.signed} prevCount={funnel.offer} totalForPercent={funnel.first_contact} onClick={() => openPlayerList("signed")} />
                  <FunnelStageRow label="Rejected" stageKey="rejected" count={funnel.rejected} prevCount={funnel.first_contact} totalForPercent={funnel.first_contact} onClick={() => openPlayerList("rejected")} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop/full layout */}
        <div ref={exportRef} className="hidden space-y-6 lg:block">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Kandydaci w pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.totalCandidates}
                </div>
                {deltas?.totalCandidates !== null && deltas?.totalCandidates !== undefined && (
                  <div className="text-xs text-slate-500 tabular-nums">
                    {deltas.totalCandidates === null ? "—" : `${deltas.totalCandidates.toFixed(1)}%`}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Konwersja całkowita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.conversionRate.toFixed(1)}%
                </div>
                {deltas?.conversionRate !== null && deltas?.conversionRate !== undefined && (
                  <div className="text-xs text-slate-500 tabular-nums">
                    {deltas.conversionRate === null ? "—" : `${deltas.conversionRate.toFixed(1)}%`}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Średni czas rekrutacji</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.timeToHireDaysAvg.toFixed(1)}d
                </div>
                {deltas?.timeToHireDaysAvg !== null && deltas?.timeToHireDaysAvg !== undefined && (
                  <div className="text-xs text-slate-500 tabular-nums">
                    {deltas.timeToHireDaysAvg === null ? "—" : `${deltas.timeToHireDaysAvg.toFixed(1)}%`}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Aktywne testy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {metricsQuery.data.kpi.activeTrials}
                </div>
                {deltas?.activeTrials !== null && deltas?.activeTrials !== undefined && (
                  <div className="text-xs text-slate-500 tabular-nums">
                    {deltas.activeTrials === null ? "—" : `${deltas.activeTrials.toFixed(1)}%`}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="flex flex-wrap justify-start">
              <TabsTrigger value="funnel">Funnel</TabsTrigger>
              <TabsTrigger value="sankey">Sankey</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="gauges">Gauges</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Funnel (lejek)</div>
              <div className="grid gap-2">
                {funnel && (
                  <>
                    <FunnelStageRow
                      label="First Contact"
                      stageKey="first_contact"
                      count={funnel.first_contact}
                      prevCount={null}
                      totalForPercent={funnel.first_contact}
                      onClick={() => openPlayerList("first_contact")}
                    />
                    <FunnelStageRow
                      label="Observed"
                      stageKey="observed"
                      count={funnel.observed}
                      prevCount={funnel.first_contact}
                      totalForPercent={funnel.first_contact}
                      onClick={() => openPlayerList("observed")}
                    />
                    <FunnelStageRow
                      label="Shortlist"
                      stageKey="shortlist"
                      count={funnel.shortlist}
                      prevCount={funnel.observed}
                      totalForPercent={funnel.first_contact}
                      onClick={() => openPlayerList("shortlist")}
                    />
                    <FunnelStageRow
                      label="Trial"
                      stageKey="trial"
                      count={funnel.trial}
                      prevCount={funnel.shortlist}
                      totalForPercent={funnel.first_contact}
                      onClick={() => openPlayerList("trial")}
                    />
                    <FunnelStageRow
                      label="Offer"
                      stageKey="offer"
                      count={funnel.offer}
                      prevCount={funnel.trial}
                      totalForPercent={funnel.first_contact}
                      onClick={() => openPlayerList("offer")}
                    />
                    <FunnelStageRow
                      label="Signed"
                      stageKey="signed"
                      count={funnel.signed}
                      prevCount={funnel.offer}
                      totalForPercent={funnel.first_contact}
                      onClick={() => openPlayerList("signed")}
                    />
                    <FunnelStageRow
                      label="Rejected"
                      stageKey="rejected"
                      count={funnel.rejected}
                      prevCount={funnel.first_contact}
                      totalForPercent={funnel.first_contact}
                      onClick={() => openPlayerList("rejected")}
                    />
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sankey" className="space-y-3">
              {sankeyQuery.isLoading && <div className="text-sm text-slate-600">Ładowanie…</div>}
              {sankeyQuery.data && <SankeyDiagram data={sankeyQuery.data} />}
            </TabsContent>

            <TabsContent value="trends" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">Trendy</div>
                <Select
                  value={trendsGranularity}
                  onValueChange={(v) => {
                    if (isGranularity(v)) setTrendsGranularity(v);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Dzień</SelectItem>
                    <SelectItem value="week">Tydzień</SelectItem>
                    <SelectItem value="month">Miesiąc</SelectItem>
                    <SelectItem value="quarter">Kwartał</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {trendsQuery.isLoading && <div className="text-sm text-slate-600">Ładowanie…</div>}
              {trendsQuery.data && <TrendsChart buckets={trendsQuery.data.buckets} />}
            </TabsContent>

            <TabsContent value="comparisons" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">Porównania</div>
                <Select
                  value={comparisonType}
                  onValueChange={(v) => {
                    if (isComparisonType(v)) setComparisonType(v);
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scouts">Skauci</SelectItem>
                    <SelectItem value="regions">Regiony</SelectItem>
                    <SelectItem value="positions">Pozycje</SelectItem>
                    <SelectItem value="sources">Źródła</SelectItem>
                    <SelectItem value="ages">Grupy wiekowe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {comparisonsQuery.isLoading && <div className="text-sm text-slate-600">Ładowanie…</div>}
              {comparisonsQuery.data && (
                <>
                  <ComparisonsChart items={comparisonsQuery.data} />
                  <div className="overflow-auto rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Wymiar</th>
                          <th className="px-3 py-2 text-right">First</th>
                          <th className="px-3 py-2 text-right">Signed</th>
                          <th className="px-3 py-2 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonsQuery.data.slice(0, 20).map((row) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{row.label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.first_contact}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.signed}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.success_rate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="heatmap" className="space-y-3">
              {heatmapQuery.isLoading && <div className="text-sm text-slate-600">Ładowanie…</div>}
              {heatmapQuery.data && <HeatmapTable rows={heatmapQuery.data} />}
            </TabsContent>

            <TabsContent value="gauges" className="space-y-3">
              <GaugesPanel metrics={metricsQuery.data} />
            </TabsContent>
          </Tabs>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-900">Szczegółowe metryki</div>

            <details className="rounded-md border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                Pipeline Metrics
              </summary>
              {funnel && (
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="overflow-auto rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Etap</th>
                          <th className="px-3 py-2 text-right">Liczba</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            ["First Contact", funnel.first_contact],
                            ["Observed", funnel.observed],
                            ["Shortlist", funnel.shortlist],
                            ["Trial", funnel.trial],
                            ["Offer", funnel.offer],
                            ["Signed", funnel.signed],
                            ["Rejected", funnel.rejected],
                          ] as [string, number][]
                        ).map(([label, value]) => (
                          <tr key={label} className="border-t border-slate-100">
                            <td className="px-3 py-2">{label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-auto rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Przejście</th>
                          <th className="px-3 py-2 text-right">Konwersja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            ["First → Observed", funnel.first_contact ? (funnel.observed / funnel.first_contact) * 100 : 0],
                            ["Observed → Shortlist", funnel.observed ? (funnel.shortlist / funnel.observed) * 100 : 0],
                            ["Shortlist → Trial", funnel.shortlist ? (funnel.trial / funnel.shortlist) * 100 : 0],
                            ["Trial → Offer", funnel.trial ? (funnel.offer / funnel.trial) * 100 : 0],
                            ["Offer → Signed", funnel.offer ? (funnel.signed / funnel.offer) * 100 : 0],
                          ] as [string, number][]
                        ).map(([label, value]) => (
                          <tr key={label} className="border-t border-slate-100">
                            <td className="px-3 py-2">{label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{value.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </details>

            <details className="rounded-md border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                Bottleneck Detection
              </summary>
              <div className="mt-3">
                {metricsQuery.data.bottlenecks.length === 0 ? (
                  <div className="text-sm text-slate-600">Brak alertów bottleneck dla wybranych filtrów.</div>
                ) : (
                  <div className="overflow-auto rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Player</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-right">Dni</th>
                          <th className="px-3 py-2 text-right">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricsQuery.data.bottlenecks.slice(0, 30).map((b) => (
                          <tr key={b.player_id} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono text-xs">{b.player_id}</td>
                            <td className="px-3 py-2">{b.status}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{b.days_in_status}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{b.max_days ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
        </>
      )}

      <Dialog open={playerListOpen} onOpenChange={setPlayerListOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl lg:w-auto">
          <DialogHeader>
            <DialogTitle>Lista kandydatów: {playerListStatus}</DialogTitle>
          </DialogHeader>

          {playerListQuery.isLoading && <div className="text-sm text-slate-600">Ładowanie…</div>}
          {playerListQuery.error && (
            <div className="text-sm text-red-700">Nie udało się pobrać listy kandydatów.</div>
          )}

          {playerListQuery.data && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">Łącznie: {playerListQuery.data.total}</div>
              <div className="overflow-auto rounded-md border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Zawodnik</th>
                      <th className="px-3 py-2 text-left">Rok</th>
                      <th className="px-3 py-2 text-left">Pozycja</th>
                      <th className="px-3 py-2 text-left">Klub</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Dni</th>
                      <th className="px-3 py-2 text-left">Ranga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerListQuery.data.items.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          {p.first_name} {p.last_name}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{p.birth_year}</td>
                        <td className="px-3 py-2">{p.position ?? "—"}</td>
                        <td className="px-3 py-2">{p.club ?? "—"}</td>
                        <td className="px-3 py-2">{p.status}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{p.days_in_status ?? "—"}</td>
                        <td className="px-3 py-2">{p.rank ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={playerListPage <= 1}
                  onClick={() => setPlayerListPage((p) => Math.max(1, p - 1))}
                >
                  Poprzednia
                </Button>
                <div className="text-xs text-slate-600">Strona {playerListPage}</div>
                <Button
                  variant="outline"
                  disabled={playerListQuery.data.items.length < 20}
                  onClick={() => setPlayerListPage((p) => p + 1)}
                >
                  Następna
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

