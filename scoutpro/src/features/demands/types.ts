export type DemandPriority = "critical" | "high" | "standard";
export type DemandStatus = "open" | "in_progress" | "filled" | "cancelled";
export type DemandAssignmentType = "manual" | "suggested";
export type DemandPreferredFoot = "left" | "right" | "both" | "any";

export interface PlayerDemand {
  id: string;
  club_id: string;
  season: string;
  league_ids: string[];
  /** @deprecated Use positions; first element for backward compat. */
  position: string;
  /** Multi-position codes (e.g. ['LW', 'ST']). */
  positions: string[];
  quantity_needed: number;
  priority: DemandPriority;
  age_min: number | null;
  age_max: number | null;
  preferred_foot: DemandPreferredFoot | null;
  style_notes: string | null;
  notes: string | null;
  status: DemandStatus;
  filled_by_player_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  club?: { id: string; name: string } | null;
  candidates_count?: number;
}

export interface PlayerDemandCandidate {
  id: string;
  demand_id: string;
  player_id: string;
  assignment_type: DemandAssignmentType;
  accepted: boolean;
  assigned_by: string;
  assigned_at: string;
  player?: {
    id: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    primary_position: string | null;
    club?: { name: string } | null;
    pipeline_status?: string | null;
  } | null;
}

export interface PlayerDemandFilters {
  clubId?: string | null;
  season?: string | null;
  position?: string | null;
  priority?: DemandPriority | null;
  status?: DemandStatus | null;
}

export const DEMAND_PRIORITY_ORDER: DemandPriority[] = ["critical", "high", "standard"];

export const DEMAND_PRIORITY_LABELS: Record<DemandPriority, string> = {
  critical: "Krytyczny",
  high: "Wysoki",
  standard: "Standardowy",
};

export const DEMAND_STATUS_LABELS: Record<DemandStatus, string> = {
  open: "Otwarte",
  in_progress: "W trakcie",
  filled: "Wypełnione",
  cancelled: "Anulowane",
};

export const DEMAND_PREFERRED_FOOT_LABELS: Record<DemandPreferredFoot, string> = {
  left: "Lewa",
  right: "Prawa",
  both: "Obustronna",
  any: "Bez preferencji",
};
