import type { Database } from "@/types/database.types";

export type PositionDictionaryRow = Database["public"]["Tables"]["position_dictionary"]["Row"];
export type PositionDictionaryInsert = Database["public"]["Tables"]["position_dictionary"]["Insert"];
export type PositionDictionaryUpdate = Database["public"]["Tables"]["position_dictionary"]["Update"];

export type FormationRow = Database["public"]["Tables"]["formations"]["Row"];
export type FormationInsert = Database["public"]["Tables"]["formations"]["Insert"];
export type FormationUpdate = Database["public"]["Tables"]["formations"]["Update"];

export type TacticalSlotRow = Database["public"]["Tables"]["tactical_slots"]["Row"];
export type TacticalSlotInsert = Database["public"]["Tables"]["tactical_slots"]["Insert"];
export type TacticalSlotUpdate = Database["public"]["Tables"]["tactical_slots"]["Update"];

export type SlotSide = "L" | "C" | "R";
export type SlotDepth = "GK" | "DEF" | "MID" | "ATT";

export interface FormationWithSlots extends FormationRow {
  tactical_slots: (TacticalSlotRow & { position_dictionary: PositionDictionaryRow | null })[];
}

export interface FormationListItem extends FormationRow {
  slots_count?: number;
}

/** Slot in editor (may have client-only id for new slots). */
export interface EditableSlot {
  id?: string;
  position_id: string;
  slot_label: string | null;
  x: number;
  y: number;
  side: SlotSide;
  depth: SlotDepth;
  is_required: boolean;
  role_hint: string | null;
  display_order: number;
  /** Resolved from position_dictionary for display */
  position_code?: string;
  position_number?: number;
}
