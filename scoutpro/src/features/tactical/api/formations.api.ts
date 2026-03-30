import { supabase } from "@/lib/supabase";
import type {
  FormationInsert,
  FormationListItem,
  FormationRow,
  FormationWithSlots,
  TacticalSlotInsert,
} from "../types";

/** List formations with slot count. */
export async function fetchFormations(): Promise<FormationListItem[]> {
  // NOTE: PostgREST needs a recognized FK relationship to embed `tactical_slots(count)`.
  // On some environments (older schema cache / missing relationship exposure) this can error,
  // which would make formation dropdowns appear empty. We fall back to a simple select.
  const primary = await supabase
    .from("formations")
    .select("*, tactical_slots(count)")
    .order("code", { ascending: true });

  if (!primary.error) {
    const data = primary.data ?? [];
    return data.map((row) => {
      const slots = (row as { tactical_slots?: { count: number }[] })?.tactical_slots;
      const slots_count = Array.isArray(slots) && slots.length > 0 ? slots[0]?.count ?? 0 : 0;
      const { tactical_slots, ...rest } = row as any;
      return { ...rest, slots_count } as FormationListItem;
    });
  }

  const fallback = await supabase
    .from("formations")
    .select("*")
    .order("code", { ascending: true });
  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []) as FormationListItem[];
}

/** Fetch formation by id with slots and position dictionary. */
export async function fetchFormationById(id: string): Promise<FormationWithSlots | null> {
  const { data, error } = await supabase
    .from("formations")
    .select(
      "*, tactical_slots(*, position_dictionary(*))"
    )
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const row = data as FormationWithSlots;
  if (row.tactical_slots) {
    row.tactical_slots.sort((a, b) => a.display_order - b.display_order);
  }
  return row;
}

/** Fetch the formation marked as default (is_default = true) with slots. Returns null if none set. */
export async function fetchDefaultFormation(): Promise<FormationWithSlots | null> {
  const { data: list, error: listError } = await supabase
    .from("formations")
    .select("id")
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();
  if (listError) throw listError;
  if (!list?.id) return null;
  return fetchFormationById(list.id);
}

/** Create formation with optional slots. */
export async function createFormation(
  input: Omit<FormationInsert, "id">,
  slots?: Omit<TacticalSlotInsert, "id" | "formation_id">[]
): Promise<FormationRow> {
  const { data: formation, error: formError } = await supabase
    .from("formations")
    .insert({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (formError) throw formError;
  const formationId = (formation as FormationRow).id;

  if (slots && slots.length > 0) {
    const slotRows = slots.map((s, i) => ({
      formation_id: formationId,
      ...s,
      display_order: s.display_order ?? i,
    }));
    const { error: slotsError } = await supabase.from("tactical_slots").insert(slotRows);
    if (slotsError) throw slotsError;
  }

  return formation as FormationRow;
}

/** Update formation metadata (name, code, description, is_default). Slots updated separately. */
export async function updateFormation(
  id: string,
  input: Partial<Pick<FormationRow, "name" | "code" | "description" | "is_default" | "version">>
): Promise<void> {
  const { error } = await supabase
    .from("formations")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Replace all slots for a formation (delete existing + insert new). */
export async function replaceFormationSlots(
  formationId: string,
  slots: Omit<TacticalSlotInsert, "id" | "formation_id">[]
): Promise<void> {
  const { error: delError } = await supabase
    .from("tactical_slots")
    .delete()
    .eq("formation_id", formationId);
  if (delError) throw delError;

  if (slots.length === 0) return;

  const rows = slots.map((s, i) => ({
    formation_id: formationId,
    ...s,
    display_order: s.display_order ?? i,
  }));
  const { error: insertError } = await supabase.from("tactical_slots").insert(rows);
  if (insertError) throw insertError;
}

/** Set formation as default (RPC). */
export async function setFormationDefault(formationId: string): Promise<void> {
  const { error } = await (supabase as any).rpc("formation_set_default", {
    p_formation_id: formationId,
  });
  if (error) throw error;
}

/** Clone formation: new formation (is_system=false, created_by=current user) + copy all slots. */
export async function cloneFormation(
  sourceFormationId: string,
  createdBy: string | null
): Promise<FormationRow> {
  const source = await fetchFormationById(sourceFormationId);
  if (!source) throw new Error("Schemat nie istnieje.");

  const newName = `${source.name} (kopia)`;
  const { data: newFormation, error: formError } = await supabase
    .from("formations")
    .insert({
      name: newName,
      code: source.code,
      description: source.description,
      is_default: false,
      is_system: false,
      created_by: createdBy,
      version: 1,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (formError) throw formError;
  const newId = (newFormation as FormationRow).id;

  const slots = (source.tactical_slots ?? []).map((s) => ({
    position_id: s.position_id,
    slot_label: s.slot_label,
    x: s.x,
    y: s.y,
    side: s.side,
    depth: s.depth,
    is_required: s.is_required,
    role_hint: s.role_hint,
    display_order: s.display_order,
  }));
  await replaceFormationSlots(newId, slots);

  return newFormation as FormationRow;
}

/** Delete formation. Fails for system formations (enforce in UI) or if RLS blocks. */
export async function deleteFormation(id: string): Promise<void> {
  const { error } = await supabase.from("formations").delete().eq("id", id);
  if (error) throw error;
}
