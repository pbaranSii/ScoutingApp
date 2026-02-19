import type { PipelineMetricsResponse } from "../types";

function parsePercent(raw?: string) {
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

function GaugeRow(props: { label: string; value: number; target: number | null }) {
  const { value, target } = props;
  const pct = Math.max(0, Math.min(100, value));
  const targetPct = target ?? null;
  return (
    <div className="space-y-1 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{props.label}</div>
        <div className="text-sm font-bold tabular-nums text-slate-900">
          {pct.toFixed(1)}%{targetPct !== null ? ` / ${targetPct.toFixed(0)}%` : ""}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function GaugesPanel({ metrics }: { metrics: PipelineMetricsResponse }) {
  const funnel = metrics.funnel;
  const settings = metrics.settings ?? {};

  const first = funnel.first_contact || 0;
  const convOverall = first > 0 ? (funnel.signed / first) * 100 : 0;
  const convFirstObserved = first > 0 ? (funnel.observed / first) * 100 : 0;
  const convObservedShortlist = funnel.observed > 0 ? (funnel.shortlist / funnel.observed) * 100 : 0;
  const convShortlistTrial = funnel.shortlist > 0 ? (funnel.trial / funnel.shortlist) * 100 : 0;
  const convTrialOffer = funnel.trial > 0 ? (funnel.offer / funnel.trial) * 100 : 0;
  const convOfferSigned = funnel.offer > 0 ? (funnel.signed / funnel.offer) * 100 : 0;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <GaugeRow label="Overall Success Rate" value={convOverall} target={parsePercent(settings.target_first_to_observed)} />
      <GaugeRow
        label="First → Observed"
        value={convFirstObserved}
        target={parsePercent(settings.target_first_to_observed)}
      />
      <GaugeRow
        label="Observed → Shortlist"
        value={convObservedShortlist}
        target={parsePercent(settings.target_observed_to_shortlist)}
      />
      <GaugeRow
        label="Shortlist → Trial"
        value={convShortlistTrial}
        target={parsePercent(settings.target_shortlist_to_trial)}
      />
      <GaugeRow
        label="Trial → Offer"
        value={convTrialOffer}
        target={parsePercent(settings.target_trial_to_offer)}
      />
      <GaugeRow
        label="Offer → Signed"
        value={convOfferSigned}
        target={parsePercent(settings.target_offer_to_signed)}
      />
    </div>
  );
}

