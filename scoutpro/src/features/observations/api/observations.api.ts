import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { Observation, ObservationInput } from "../types";

type ObservationInsert = Database["public"]["Tables"]["observations"]["Insert"];
type ObservationUpdate = Database["public"]["Tables"]["observations"]["Update"];

const VALID_OBSERVATION_SOURCE = new Set<string>([
  "scouting",
  "referral",
  "application",
  "trainer_report",
  "scout_report",
  "video_analysis",
  "tournament",
  "training_camp",
]);
const UPDATE_KEYS: (keyof ObservationUpdate)[] = [
  "competition",
  "location",
  "match_result",
  "mental_rating",
  "motor_rating",
  "notes",
  "observation_date",
  "positions",
  "photo_url",
  "potential_future",
  "potential_now",
  "rank",
  "recommendations",
  "source",
  "speed_rating",
  "strengths",
  "strengths_notes",
  "tactical_rating",
  "technical_rating",
  "team_role",
  "weaknesses",
  "weaknesses_notes",
  "overall_rating",
  "updated_at",
  "updated_by",
  "updated_by_name",
  "updated_by_role",
];

export async function fetchObservations() {
  const { data, error } = await supabase
    .from("observations")
    .select("*, player:players(first_name,last_name,birth_year,primary_position,pipeline_status,club:clubs(name))")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Observation[];
}

export async function fetchObservationsByPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("observations")
    .select(
      "*, player:players(first_name,last_name,birth_year,primary_position,pipeline_status,club:clubs(name))"
    )
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Observation[];
}

/** Max IDs per request to avoid 400 from URL length (PostgREST .in() in query string). */
const BATCH_IN_QUERY_CHUNK = 80;

/** Fetch latest overall_rating per player (for pipeline cards). Returns playerId -> rating (1-10). Batched to avoid 400. */
export async function fetchLatestObservationRatings(
  playerIds: string[]
): Promise<Record<string, number>> {
  if (playerIds.length === 0) return {};
  const deduped = [...new Set(playerIds)];
  const map: Record<string, number> = {};
  for (let i = 0; i < deduped.length; i += BATCH_IN_QUERY_CHUNK) {
    const chunk = deduped.slice(i, i + BATCH_IN_QUERY_CHUNK);
    const { data, error } = await supabase
      .from("observations")
      .select("player_id, overall_rating, created_at")
      .in("player_id", chunk)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as { player_id: string; overall_rating: number | null }[];
    for (const row of rows) {
      if (row.player_id && !(row.player_id in map) && typeof row.overall_rating === "number") {
        map[row.player_id] = row.overall_rating;
      }
    }
  }
  return map;
}

export async function fetchObservationById(id: string) {
  const { data, error } = await supabase
    .from("observations")
    .select(
      "*, player:players(first_name,last_name,birth_year,primary_position,pipeline_status,club:clubs(name))"
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Observation;
}

const BASE_OPTIONAL = [
  "rank",
  "notes",
  "competition",
  "overall_rating",
  "potential_now",
  "potential_future",
  "strengths",
  "weaknesses",
  "photo_url",
  "created_by",
  "created_by_name",
  "created_by_role",
  "updated_by",
  "updated_at",
  "updated_by_name",
  "updated_by_role",
] as const;

const EXTENDED_OPTIONAL = [
  "match_result",
  "location",
  "positions",
  "technical_rating",
  "speed_rating",
  "motor_rating",
  "tactical_rating",
  "mental_rating",
  "strengths_notes",
  "weaknesses_notes",
  "team_role",
  "recommendations",
] as const;

const PGRST204_COLUMN_REGEX = /Could not find the '([^']+)' column/;

function buildObservationRow(
  input: ObservationInput,
  includeExtended: boolean
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    player_id: input.player_id,
    scout_id: input.scout_id,
    source: input.source,
    observation_date: input.observation_date,
    status: "active",
  };
  const keys = includeExtended
    ? ([...BASE_OPTIONAL, ...EXTENDED_OPTIONAL] as const)
    : BASE_OPTIONAL;
  for (const key of keys) {
    const v = input[key as keyof ObservationInput];
    if (v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") {
      row[key] = null;
    } else {
      row[key] = v;
    }
  }
  return row;
}

export async function createObservation(input: ObservationInput) {
  let payload = buildObservationRow(input, true) as Record<string, unknown>;
  let { data, error } = await supabase
    .from("observations")
    .insert(payload as ObservationInsert)
    .select("*")
    .single();

  while (error?.code === "PGRST204") {
    const match = error.message?.match(PGRST204_COLUMN_REGEX);
    if (!match) break;
    const column = match[1];
    const { [column]: removed, ...rest } = payload;
    void removed;
    payload = rest;
    const next = await supabase
      .from("observations")
      .insert(payload as ObservationInsert)
      .select("*")
      .single();
    data = next.data;
    error = next.error;
  }

  if (error) {
    console.error("createObservation error", error.message, error.details, error.hint, payload);
    throw error;
  }
  return data as Observation;
}

/** Build a payload safe for PATCH: only allowed keys, no undefined, valid enum for source. */
function buildUpdatePayload(input: Partial<ObservationInput>): ObservationUpdate {
  const payload: Record<string, unknown> = {};
  for (const key of UPDATE_KEYS) {
    const v = input[key as keyof ObservationInput];
    if (v === undefined) continue;
    if (key === "source") {
      const s = typeof v === "string" ? v.trim() : null;
      if (s && VALID_OBSERVATION_SOURCE.has(s)) {
        payload[key] = s;
      }
      continue;
    }
    if (typeof v === "string" && v.trim() === "") {
      payload[key] = null;
    } else {
      payload[key] = v;
    }
  }
  return payload as ObservationUpdate;
}

export async function updateObservation(id: string, input: Partial<ObservationInput>) {
  let payload = buildUpdatePayload(input) as Record<string, unknown>;
  let { error } = await supabase.from("observations").update(payload).eq("id", id);
  while (error?.code === "PGRST204") {
    const match = error.message?.match(PGRST204_COLUMN_REGEX);
    if (!match) throw error;
    const column = match[1];
    const { [column]: removed, ...rest } = payload;
    void removed;
    payload = rest;
    if (Object.keys(payload).length === 0) throw error;
    const next = await supabase.from("observations").update(payload).eq("id", id);
    error = next.error;
  }
  if (error) throw error;
}

export async function deleteObservation(id: string) {
  const { data, error } = await supabase.from("observations").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Nie udalo sie usunac obserwacji. Sprawdz uprawnienia lub czy rekord nadal istnieje."
    );
  }
}

export async function deleteObservationsByPlayer(playerId: string) {
  const { error } = await supabase
    .from("observations")
    .delete()
    .eq("player_id", playerId)
    .select("id");
  if (error) throw error;
}
