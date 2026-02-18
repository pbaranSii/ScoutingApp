export type PipelineStatus =
  | "unassigned"
  | "observed"
  | "shortlist"
  | "trial"
  | "offer"
  | "signed"
  | "rejected";

/** Shared color config for status (badge, column border, dot). Aligned with 06-UI-UX.md. */
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
  shortlist: {
    borderTop: "border-t-violet-500",
    dot: "bg-violet-500",
    badge: "border-violet-200 bg-violet-100 text-violet-700",
  },
  trial: {
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
  rejected: {
    borderTop: "border-t-red-500",
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-100 text-red-700",
  },
};

/** Tailwind class for column top border by status (use with border-t-4). */
export function getStatusBorderClass(status: PipelineStatus): string {
  return PIPELINE_STATUS_COLORS[status]?.borderTop ?? "border-t-slate-400";
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

/** All statuses for forms, filters and status label lookup (includes Nieprzypisany). */
export const ALL_PIPELINE_STATUSES: { id: PipelineStatus; label: string }[] = [
  { id: "unassigned", label: "Nieprzypisany" },
  { id: "observed", label: "Obserwacja" },
  { id: "shortlist", label: "Shortlista" },
  { id: "trial", label: "Testy" },
  { id: "offer", label: "Oferta" },
  { id: "signed", label: "Podpisany" },
  { id: "rejected", label: "Odrzucony" },
];

/** Only columns shown on Pipeline board (no unassigned column). Board label + optional short label for tabs. */
export const PIPELINE_BOARD_COLUMNS: {
  id: PipelineStatus;
  label: string;
  shortLabel?: string;
}[] = [
  { id: "observed", label: "Obserwacja", shortLabel: "Obserwowani" },
  { id: "shortlist", label: "Shortlista" },
  { id: "trial", label: "Testy" },
  { id: "offer", label: "Oferta" },
  { id: "signed", label: "Podpisani" },
  { id: "rejected", label: "Odrzuceni" },
];

/** @deprecated Use PIPELINE_BOARD_COLUMNS for board, ALL_PIPELINE_STATUSES for forms/filters. */
export const PIPELINE_COLUMNS = PIPELINE_BOARD_COLUMNS;
