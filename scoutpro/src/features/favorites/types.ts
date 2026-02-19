/** Formation code stored in favorite_lists.formation */
export type FormationCode = "4-4-2" | "4-3-3" | "3-5-2" | "4-2-3-1" | "5-3-2";

export interface FavoriteList {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  formation: FormationCode;
  region_id: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  owner?: { id: string; full_name: string | null; avatar_url?: string | null } | null;
  region?: { id: string; name: string } | null;
  players_count?: number;
  average_rating?: number | null;
  is_collaborator?: boolean;
}

export interface FavoriteListMember {
  id: string;
  list_id: string;
  player_id: string;
  added_by: string;
  added_at: string;
  player?: {
    id: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    primary_position: string | null;
    club?: { name: string } | null;
    pipeline_status?: string | null;
  } & { overall_rating?: number | null };
}

export interface FavoriteListCollaborator {
  id: string;
  list_id: string;
  user_id: string;
  added_at: string;
  user?: { id: string; full_name: string | null; email?: string; business_role?: string } | null;
}

export interface PitchPositionSlot {
  code: string;
  label: string;
  count: number;
  playerIds: string[];
}

export const FORMATION_OPTIONS: { value: FormationCode; label: string }[] = [
  { value: "4-4-2", label: "4-4-2" },
  { value: "4-3-3", label: "4-3-3" },
  { value: "3-5-2", label: "3-5-2" },
  { value: "4-2-3-1", label: "4-2-3-1" },
  { value: "5-3-2", label: "5-3-2" },
];

export const MAX_FAVORITE_LISTS_PER_USER = 20;
