export type PipelineStatus =
  | "unassigned"
  | "observed"
  | "in_contact"
  | "evaluation"
  | "offer"
  | "signed"
  | "rejected_by_club"
  | "rejected_by_player"
  | "out_of_reach";

/** Shared color config for status (badge, column border, dot). */
export const PIPELINE_STATUS_COLORS: Record<
  PipelineStatus,
  { borderTop: string; dot: string; badge: string }
> = {
  unassigned: {
    borderTop: "border-t-slate-400",
    dot: "bg-slate-500",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
  observed: {
    borderTop: "border-t-slate-400",
    dot: "bg-slate-500",
    badge: "border-slate-200 bg-slate-100 text-slate-700",
  },
  in_contact: {
    borderTop: "border-t-violet-500",
    dot: "bg-violet-500",
    badge: "border-violet-200 bg-violet-100 text-violet-700",
  },
  evaluation: {
    borderTop: "border-t-amber-500",
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-100 text-amber-700",
  },
  offer: {
    borderTop: "border-t-blue-500",
    dot: "bg-blue-500",
    badge: "border-blue-200 bg-blue-100 text-blue-700",
  },
  signed: {
    borderTop: "border-t-emerald-500",
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  rejected_by_club: {
    borderTop: "border-t-red-500",
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-100 text-red-700",
  },
  rejected_by_player: {
    borderTop: "border-t-red-400",
    dot: "bg-red-400",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
  out_of_reach: {
    borderTop: "border-t-slate-500",
    dot: "bg-slate-500",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

/** Tailwind class for column top border by status (use with border-t-4). */
export function getStatusBorderClass(status: PipelineStatus): string {
  return PIPELINE_STATUS_COLORS[status]?.borderTop ?? "border-t-slate-400";
}

/** Left border classes for dashboard tiles — same colors as pipeline board (use with border-l-4). */
export const PIPELINE_STATUS_LEFT_BORDER: Record<PipelineStatus, string> = {
  unassigned: "border-l-slate-400",
  observed: "border-l-slate-400",
  in_contact: "border-l-violet-500",
  evaluation: "border-l-amber-500",
  offer: "border-l-blue-500",
  signed: "border-l-emerald-500",
  rejected_by_club: "border-l-red-500",
  rejected_by_player: "border-l-red-400",
  out_of_reach: "border-l-slate-500",
};

export function getStatusLeftBorderClass(status: PipelineStatus | string): string {
  return PIPELINE_STATUS_LEFT_BORDER[status as PipelineStatus] ?? "border-l-slate-400";
}

/** Tailwind class for status badge (e.g. on player list). */
export function getStatusBadgeClass(status: PipelineStatus | string): string {
  const key = status as PipelineStatus;
  return PIPELINE_STATUS_COLORS[key]?.badge ?? PIPELINE_STATUS_COLORS.unassigned.badge;
}

/** Tailwind class for status dot (e.g. in pipeline tabs). */
export function getStatusDotClass(status: PipelineStatus): string {
  return PIPELINE_STATUS_COLORS[status]?.dot ?? "bg-slate-500";
}

/** All statuses for forms, filters and status label lookup (includes Nowy). */
export const ALL_PIPELINE_STATUSES: { id: PipelineStatus; label: string }[] = [
  { id: "unassigned", label: "Nowy" },
  { id: "observed", label: "Obserwowany" },
  { id: "in_contact", label: "Kontakt" },
  { id: "evaluation", label: "Weryfikacja" },
  { id: "offer", label: "Oferta" },
  { id: "signed", label: "Podpisany" },
  { id: "rejected_by_club", label: "Odrzucony przez klub" },
  { id: "rejected_by_player", label: "Odrzucony przez zawodnika" },
  { id: "out_of_reach", label: "Poza zasięgiem" },
];

/** Only columns shown on Pipeline board (no unassigned). */
export const PIPELINE_BOARD_COLUMNS: {
  id: PipelineStatus;
  label: string;
  shortLabel?: string;
}[] = [
  { id: "observed", label: "Obserwowany", shortLabel: "Obserwowani" },
  { id: "in_contact", label: "Kontakt" },
  { id: "evaluation", label: "Weryfikacja" },
  { id: "offer", label: "Oferta" },
  { id: "signed", label: "Podpisani" },
  { id: "rejected_by_club", label: "Odrzucony przez klub" },
  { id: "rejected_by_player", label: "Odrzucony przez zawodnika" },
  { id: "out_of_reach", label: "Poza zasięgiem" },
];

/** @deprecated Use PIPELINE_BOARD_COLUMNS for board, ALL_PIPELINE_STATUSES for forms/filters. */
export const PIPELINE_COLUMNS = PIPELINE_BOARD_COLUMNS;

/** Map legacy pipeline_status (from cache or offline payload) to new enum. */
const LEGACY_TO_NEW: Record<string, PipelineStatus> = {
  shortlist: "in_contact",
  trial: "evaluation",
  rejected: "rejected_by_club",
};
export function normalizePipelineStatus(status: string | null | undefined): PipelineStatus | null | undefined {
  if (status == null) return status;
  return (LEGACY_TO_NEW[status] as PipelineStatus) ?? (status as PipelineStatus);
}
