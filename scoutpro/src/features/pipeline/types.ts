export type PipelineStatus =
  | "unassigned"
  | "observed"
  | "shortlist"
  | "trial"
  | "offer"
  | "signed"
  | "rejected";

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

/** Only columns shown on Pipeline board (no unassigned column). */
export const PIPELINE_BOARD_COLUMNS: { id: PipelineStatus; label: string }[] = [
  { id: "observed", label: "Obserwacja" },
  { id: "shortlist", label: "Shortlista" },
  { id: "trial", label: "Testy" },
  { id: "offer", label: "Oferta" },
  { id: "signed", label: "Podpisany" },
  { id: "rejected", label: "Odrzucony" },
];

/** @deprecated Use PIPELINE_BOARD_COLUMNS for board, ALL_PIPELINE_STATUSES for forms/filters. */
export const PIPELINE_COLUMNS = PIPELINE_BOARD_COLUMNS;
