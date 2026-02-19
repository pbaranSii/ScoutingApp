import type { FormationCode } from "../types";

/** Position codes that can appear in formation slots (same as players.positions). */
export type PositionCode =
  | "GK"
  | "LB"
  | "LCB"
  | "CB"
  | "RCB"
  | "RB"
  | "CDM"
  | "LM"
  | "CM"
  | "RM"
  | "CAM"
  | "LW"
  | "RW"
  | "LS"
  | "ST"
  | "RS";

/** One slot on the pitch (e.g. "CM" in 4-4-2 has 2 slots). */
export interface FormationSlot {
  positionCode: PositionCode;
  label: string;
}

/** Formation definition: rows of position codes (back to front: defence, mid, attack). */
const FORMATION_SLOTS: Record<FormationCode, FormationSlot[]> = {
  "4-4-2": [
    { positionCode: "ST", label: "ST" },
    { positionCode: "ST", label: "ST" },
    { positionCode: "LW", label: "LW" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "RW", label: "RW" },
    { positionCode: "LB", label: "LB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "RB", label: "RB" },
    { positionCode: "GK", label: "GK" },
  ],
  "4-3-3": [
    { positionCode: "LW", label: "LW" },
    { positionCode: "ST", label: "ST" },
    { positionCode: "RW", label: "RW" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "LB", label: "LB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "RB", label: "RB" },
    { positionCode: "GK", label: "GK" },
  ],
  "3-5-2": [
    { positionCode: "ST", label: "ST" },
    { positionCode: "ST", label: "ST" },
    { positionCode: "LM", label: "LM" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "CAM", label: "CAM" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "RM", label: "RM" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "GK", label: "GK" },
  ],
  "4-2-3-1": [
    { positionCode: "ST", label: "ST" },
    { positionCode: "LW", label: "LW" },
    { positionCode: "CAM", label: "CAM" },
    { positionCode: "RW", label: "RW" },
    { positionCode: "CDM", label: "CDM" },
    { positionCode: "CDM", label: "CDM" },
    { positionCode: "LB", label: "LB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "RB", label: "RB" },
    { positionCode: "GK", label: "GK" },
  ],
  "5-3-2": [
    { positionCode: "ST", label: "ST" },
    { positionCode: "ST", label: "ST" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "CM", label: "CM" },
    { positionCode: "LB", label: "LB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "CB", label: "CB" },
    { positionCode: "RB", label: "RB" },
    { positionCode: "GK", label: "GK" },
  ],
};

export function getFormationSlots(formation: FormationCode): FormationSlot[] {
  return FORMATION_SLOTS[formation] ?? FORMATION_SLOTS["4-4-2"];
}

/** Map legacy primary_position (e.g. "8") or code (e.g. "CM") to a position code used in formations. */
const LEGACY_TO_SLOT: Record<string, PositionCode> = {
  "1": "GK",
  "2": "RB",
  "3": "LB",
  "4": "CB",
  "6": "CDM",
  "7": "RW",
  "8": "CM",
  "9": "ST",
  "10": "CAM",
  "11": "LW",
  GK: "GK",
  LB: "LB",
  LCB: "CB",
  CB: "CB",
  RCB: "CB",
  RB: "RB",
  CDM: "CDM",
  LM: "LM",
  CM: "CM",
  RM: "RM",
  CAM: "CAM",
  LW: "LW",
  RW: "RW",
  LS: "ST",
  ST: "ST",
  RS: "ST",
};

export function normalizePositionForSlot(primaryPosition: string | null | undefined): PositionCode | null {
  if (!primaryPosition || !primaryPosition.trim()) return null;
  const t = primaryPosition.trim();
  return (LEGACY_TO_SLOT[t] ?? LEGACY_TO_SLOT[t.toUpperCase()] ?? null) as PositionCode | null;
}

export interface SlotCount {
  positionCode: PositionCode;
  label: string;
  count: number;
  playerIds: string[];
}

/** Group players by position slot for a formation; returns slot counts and bench (no position / unknown). */
export function groupPlayersByFormationSlots(
  formation: FormationCode,
  members: { player_id: string; player?: { primary_position?: string | null } | null }[]
): { slots: SlotCount[]; benchPlayerIds: string[] } {
  const slots = getFormationSlots(formation);
  const slotMap = new Map<PositionCode, { label: string; playerIds: string[] }>();
  for (const s of slots) {
    if (!slotMap.has(s.positionCode)) {
      slotMap.set(s.positionCode, { label: s.label, playerIds: [] });
    }
  }
  const benchPlayerIds: string[] = [];
  const assigned = new Set<string>();

  for (const m of members) {
    const pos = normalizePositionForSlot(m.player?.primary_position ?? null);
    if (!pos) {
      benchPlayerIds.push(m.player_id);
      continue;
    }
    const slot = slotMap.get(pos);
    if (slot) {
      slot.playerIds.push(m.player_id);
      assigned.add(m.player_id);
    } else {
      benchPlayerIds.push(m.player_id);
    }
  }

  const resultSlots: SlotCount[] = [];
  for (const [positionCode, { label, playerIds }] of slotMap) {
    resultSlots.push({ positionCode, label, count: playerIds.length, playerIds });
  }
  return { slots: resultSlots, benchPlayerIds };
}
