export type PipelineStatus =
  | "observed"
  | "shortlist"
  | "trial"
  | "offer"
  | "signed"
  | "rejected";

export const PIPELINE_COLUMNS: { id: PipelineStatus; label: string }[] = [
  { id: "observed", label: "Obserwacja" },
  { id: "shortlist", label: "Shortlista" },
  { id: "trial", label: "Testy" },
  { id: "offer", label: "Oferta" },
  { id: "signed", label: "Podpisany" },
  { id: "rejected", label: "Odrzucony" },
];
