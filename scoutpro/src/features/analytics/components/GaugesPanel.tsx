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
  const convObservedInContact = funnel.observed > 0 ? (funnel.in_contact / funnel.observed) * 100 : 0;
  const convInContactEvaluation = funnel.in_contact > 0 ? (funnel.evaluation / funnel.in_contact) * 100 : 0;
  const convEvaluationOffer = funnel.evaluation > 0 ? (funnel.offer / funnel.evaluation) * 100 : 0;
  const convOfferSigned = funnel.offer > 0 ? (funnel.signed / funnel.offer) * 100 : 0;

  const targetObservedInContact = settings.target_observed_to_in_contact ?? settings.target_observed_to_shortlist;
  const targetInContactEvaluation = settings.target_in_contact_to_evaluation ?? settings.target_shortlist_to_trial;
  const targetEvaluationOffer = settings.target_evaluation_to_offer ?? settings.target_trial_to_offer;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <GaugeRow label="Overall Success Rate" value={convOverall} target={parsePercent(settings.target_first_to_observed)} />
      <GaugeRow
        label="First → Observed"
        value={convFirstObserved}
        target={parsePercent(settings.target_first_to_observed)}
      />
      <GaugeRow
        label="Observed → Kontakt"
        value={convObservedInContact}
        target={parsePercent(targetObservedInContact)}
      />
      <GaugeRow
        label="Kontakt → Weryfikacja"
        value={convInContactEvaluation}
        target={parsePercent(targetInContactEvaluation)}
      />
      <GaugeRow
        label="Weryfikacja → Offer"
        value={convEvaluationOffer}
        target={parsePercent(targetEvaluationOffer)}
      />
      <GaugeRow
        label="Offer → Signed"
        value={convOfferSigned}
        target={parsePercent(settings.target_offer_to_signed)}
      />
    </div>
  );
}

