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

/** Slot with coordinates from DB (formation_id); x,y in 0–100. */
export interface SlotWithCoords {
  positionCode: string;
  label: string;
  x: number;
  y: number;
  count: number;
  playerIds: string[];
}

/** Build map: legacy primary_position string -> position_id(s) from position_dictionary rows. */
function buildLegacyToPositionIds(
  positionRows: { id: string; position_number: number; position_code: string }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of positionRows) {
    const ids = map.get(String(row.position_number)) ?? [];
    if (!ids.includes(row.id)) ids.push(row.id);
    map.set(String(row.position_number), ids);
    const codeIds = map.get(row.position_code) ?? [];
    if (!codeIds.includes(row.id)) codeIds.push(row.id);
    map.set(row.position_code, codeIds);
  }
  for (const row of positionRows) {
    if (row.position_code === "DM") {
      const ids = map.get("DM") ?? [];
      if (ids.length && !map.get("CDM")?.length) map.set("CDM", [...ids]);
    }
    if (row.position_code === "AM") {
      const ids = map.get("AM") ?? [];
      if (ids.length && !map.get("CAM")?.length) map.set("CAM", [...ids]);
    }
  }
  return map;
}

/** Resolve player primary_position (e.g. "8", "CM", "6/8", "CDM") to first matching position_id. */
function getPlayerPositionId(
  primaryPosition: string | null | undefined,
  legacyMap: Map<string, string[]>
): string | null {
  if (!primaryPosition || !primaryPosition.trim()) return null;
  const t = primaryPosition.trim();
  const firstPart = t.split("/")[0]?.trim() ?? t;
  const byNum = legacyMap.get(firstPart);
  if (byNum?.length) return byNum[0];
  const byCode = legacyMap.get(firstPart.toUpperCase());
  if (byCode?.length) return byCode[0];
  return null;
}

/** Group players by formation slots from DB; returns one slot per tactical_slot with coords and assigned players. */
export function groupPlayersByFormationSlotsFromDb(
  formationWithSlots: {
    tactical_slots: ((
      | { position_id: string; x: number; y: number; display_order: number }
      | (unknown & { position_dictionary: { id: string; position_number: number; position_code: string } | null })
    ))[];
  },
  members: { player_id: string; player?: { primary_position?: string | null } | null }[]
): { slots: SlotWithCoords[]; benchPlayerIds: string[] } {
  const slots = formationWithSlots.tactical_slots ?? [];
  const positionRows = slots
    .map((s) => (s as { position_dictionary?: { id: string; position_number: number; position_code: string } | null }).position_dictionary)
    .filter(Boolean) as { id: string; position_number: number; position_code: string }[];
  const legacyMap = buildLegacyToPositionIds(positionRows);
  const playerToPositionId = new Map<string, string>();
  const assigned = new Set<string>();
  for (const m of members) {
    const posId = getPlayerPositionId(m.player?.primary_position ?? null, legacyMap);
    if (posId) {
      playerToPositionId.set(m.player_id, posId);
      assigned.add(m.player_id);
    }
  }
  const benchPlayerIds = members.map((m) => m.player_id).filter((id) => !assigned.has(id));
  const playersByPositionId = new Map<string, string[]>();
  for (const [playerId, posId] of playerToPositionId) {
    const arr = playersByPositionId.get(posId) ?? [];
    arr.push(playerId);
    playersByPositionId.set(posId, arr);
  }
  const slotsWithCoords: SlotWithCoords[] = [];
  for (const slot of slots) {
    const s = slot as {
      position_id: string;
      x: number;
      y: number;
      position_dictionary: { position_code: string; position_name_pl?: string } | null;
    };
    const pos = s.position_dictionary;
    const positionCode = pos?.position_code ?? "?";
    const label = pos?.position_name_pl ?? positionCode;
    const playerIds = playersByPositionId.get(s.position_id) ?? [];
    slotsWithCoords.push({
      positionCode,
      label,
      x: s.x,
      y: s.y,
      count: playerIds.length,
      playerIds,
    });
  }
  return { slots: slotsWithCoords, benchPlayerIds };
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

/** Apply manual slot_assignments (slotKey -> player_id) to auto-assigned slots. Returns updated slots and bench. */
export function applySlotAssignments<T extends { playerIds: string[]; count: number }>(
  slots: T[],
  slotKeys: string[],
  slot_assignments: Record<string, string> | null | undefined,
  memberIds: string[]
): { slots: T[]; benchPlayerIds: string[] } {
  const assignments = slot_assignments ?? {};
  const assignedPlayerIds = new Set(
    Object.values(assignments).filter((id) => memberIds.includes(id))
  );
  const slotsResult = slots.map((slot, i) => {
    const key = slotKeys[i];
    const assignedId = key ? assignments[key] : undefined;
    if (assignedId && memberIds.includes(assignedId)) {
      return { ...slot, playerIds: [assignedId], count: 1 };
    }
    const filtered = slot.playerIds.filter((id) => !assignedPlayerIds.has(id));
    return { ...slot, playerIds: filtered, count: filtered.length };
  });
  const onPitch = new Set(slotsResult.flatMap((s) => s.playerIds));
  const benchPlayerIds = memberIds.filter((id) => !onPitch.has(id));
  return { slots: slotsResult, benchPlayerIds };
}
