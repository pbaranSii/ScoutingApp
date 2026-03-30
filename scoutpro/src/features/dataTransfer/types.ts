export type DataTransferBundleVersion = "1.0";

export type DataTransferBundle = {
  bundleVersion: DataTransferBundleVersion;
  createdAt: string; // ISO
  sourceInstance: string; // e.g. "dev", "prod", project ref, url
  exportedBy: {
    userId: string;
    email?: string | null;
  };

  /**
   * Users referenced by exported entities.
   * Identity key for mapping across instances: email (required).
   */
  users: Array<{
    sourceId: string; // original UUID in source instance
    email: string;
    full_name?: string | null;
    role?: "admin" | "user";
    business_role?: "scout" | "coach" | "director" | "suspended" | "admin";
    area_access?: "AKADEMIA" | "SENIOR" | "ALL";
    is_active?: boolean;
  }>;

  /** Reference dictionaries used by players/observations (natural keys only). */
  clubs: Array<{
    name: string;
    area?: string | null; // "AKADEMIA" | "SENIOR" | "ALL" (string to avoid tight coupling)
    city?: string | null;
    country_pl?: string | null;
    league_name?: string | null;
    region_name?: string | null;
    is_active?: boolean;
  }>;

  regions: Array<{
    name: string;
    is_active?: boolean;
  }>;

  categories: Array<{
    name: string;
    area?: string | null;
    is_active?: boolean;
    age_under?: number | null;
    min_birth_year?: number | null;
    max_birth_year?: number | null;
  }>;

  players: Array<{
    sourceId: string; // original UUID in source instance
    first_name: string;
    last_name: string;
    birth_year: number;
    birth_date?: string | null;
    nationality?: string | null;
    dominant_foot?: "left" | "right" | "both" | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    body_build?: string | null;
    primary_position?: string | null;
    secondary_positions?: string[] | null;
    contract_end_date?: string | null;

    club_name?: string | null;
    region_name?: string | null;
    age_category_name?: string | null;
    age_category_area?: string | null;

    created_by_email?: string | null;

    extras?: Record<string, unknown> | null;
  }>;

  observations: Array<{
    sourceId: string; // original UUID in source instance
    player_sourceId: string; // link to players.sourceId
    scout_email: string;
    observation_date: string; // YYYY-MM-DD
    source?: string; // enum string, validated on import
    status?: string;

    notes?: string | null;
    summary?: string | null;
    rank?: string | null;
    competition?: string | null;
    potential_now?: number | null;
    potential_future?: number | null;
    recommendation?: string | null;

    created_by_email?: string | null;
    updated_by_email?: string | null;

    extras?: Record<string, unknown> | null;
  }>;
};

export type ImportPreflightSeverity = "info" | "warning" | "error";

export type ImportPreflightReport = {
  ok: boolean;
  bundleVersion?: string;
  summary: {
    users: number;
    players: number;
    observations: number;
    clubs: number;
    regions: number;
    categories: number;
  };
  duplicateCheck: {
    duplicatePlayersInBundle: number;
    duplicateObservationsInBundle: number;
  };
  userMapping: {
    missingEmails: number;
    duplicateEmailsInBundle: number;
    willCreateUsers: number;
    willMapUsers: number;
  };
  issues: Array<{
    severity: ImportPreflightSeverity;
    code: string;
    message: string;
    path?: string;
    count?: number;
    examples?: unknown[];
  }>;
};

