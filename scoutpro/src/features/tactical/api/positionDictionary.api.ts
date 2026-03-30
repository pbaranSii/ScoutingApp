import { supabase } from "@/lib/supabase";
import type { PositionDictionaryInsert, PositionDictionaryRow, PositionDictionaryUpdate } from "../types";

/** List all position dictionary entries, optionally only active. */
export async function fetchPositionDictionary(activeOnly = true): Promise<PositionDictionaryRow[]> {
  let query = supabase
    .from("position_dictionary")
    .select("*")
    .order("display_order", { ascending: true })
    .order("position_number", { ascending: true })
    .order("position_code", { ascending: true });
  if (activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PositionDictionaryRow[];
}

/** Fetch single position by id. */
export async function fetchPositionById(id: string): Promise<PositionDictionaryRow | null> {
  const { data, error } = await supabase
    .from("position_dictionary")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as PositionDictionaryRow;
}

/** Create a new position dictionary entry. */
export async function createPosition(input: PositionDictionaryInsert): Promise<PositionDictionaryRow> {
  const { data, error } = await supabase
    .from("position_dictionary")
    .insert({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as PositionDictionaryRow;
}

/** Update position dictionary entry. */
export async function updatePosition(
  id: string,
  input: PositionDictionaryUpdate
): Promise<PositionDictionaryRow> {
  const { data, error } = await supabase
    .from("position_dictionary")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as PositionDictionaryRow;
}

/** Deactivate position (soft delete). */
export async function deactivatePosition(id: string): Promise<void> {
  await updatePosition(id, { is_active: false });
}

/** Check if position is used in any tactical slot. */
export async function isPositionUsedInFormations(positionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("tactical_slots")
    .select("id")
    .eq("position_id", positionId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
