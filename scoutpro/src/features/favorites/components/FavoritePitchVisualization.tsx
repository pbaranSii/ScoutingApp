import { useMemo, useState } from "react";
import type { FormationCode } from "../types";
import { getFormationSlots } from "../utils/formations";
import type { SlotCount, SlotWithCoords } from "../utils/formations";
import { getPitchMarkings } from "@/components/pitch/pitchConstants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FavoritePitchVisualizationProps = {
  /** Legacy formation code when slotsWithCoords not used */
  formation: FormationCode;
  /** Legacy slot counts or slots from DB (when using formation_id). */
  slots: SlotCount[] | SlotWithCoords[];
  /** When list uses formation_id: slots with x,y from DB (0–100). Takes precedence over formation/slots for layout. */
  slotsWithCoords?: SlotWithCoords[];
  /** Stable keys for each slot (same order as slotCoords). Used for slot_assignments. */
  slotKeys?: string[];
  benchPlayerIds: string[];
  memberNames: Record<string, string>;
  /** All member player ids (for assign dialog). */
  allMemberIds?: string[];
  selectedPositionCode: string | null;
  onSelectPosition: (positionCode: string | null) => void;
  /** When set, called to assign a player to a slot or clear assignment. */
  onAssignSlot?: (slotKey: string, playerId: string | null) => void;
};

/** One (x, y) per unique position code in formation order (attack to defence). */
function getSlotCoordinates(formation: FormationCode): { positionCode: string; x: number; y: number }[] {
  const slots = getFormationSlots(formation);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of slots) {
    if (!seen.has(s.positionCode)) {
      seen.add(s.positionCode);
      unique.push(s.positionCode);
    }
  }
  const width = 600;
  const out: { positionCode: string; x: number; y: number }[] = [];
  const rowLayout: Record<FormationCode, number[]> = {
    "4-4-2": [1, 3, 3, 1],
    "4-3-3": [3, 3, 3, 1],
    "3-5-2": [1, 3, 3, 1],
    "4-2-3-1": [1, 3, 2, 3, 1],
    "5-3-2": [1, 3, 3, 1],
  };
  const rowSizes = rowLayout[formation] ?? [1, 3, 3, 1];
  const rowYs = [140, 300, 480, 640, 800];
  let idx = 0;
  for (let ri = 0; ri < rowSizes.length && idx < unique.length; ri++) {
    const n = rowSizes[ri];
    const y = rowYs[ri] ?? 450;
    for (let j = 0; j < n && idx < unique.length; j++) {
      const x = n === 1 ? width / 2 : (width * (j + 1)) / (n + 1);
      out.push({ positionCode: unique[idx], x, y });
      idx++;
    }
  }
  return out;
}

function slotColor(count: number): string {
  if (count === 0) return "bg-red-100 border-red-500 text-red-900";
  if (count === 1) return "bg-amber-100 border-amber-500 text-amber-900";
  if (count >= 2 && count <= 3) return "bg-green-100 border-green-600 text-green-900";
  return "bg-blue-100 border-blue-600 text-blue-900";
}

export function FavoritePitchVisualization({
  formation,
  slots,
  slotsWithCoords,
  slotKeys = [],
  benchPlayerIds,
  memberNames,
  allMemberIds = [],
  selectedPositionCode,
  onSelectPosition,
  onAssignSlot,
}: FavoritePitchVisualizationProps) {
  const [assignDialog, setAssignDialog] = useState<{ slotKey: string; positionCode: string } | null>(null);
  const viewBoxW = 600;
  const viewBoxH = 900;
  const pitch = getPitchMarkings(viewBoxW, viewBoxH);

  const slotCoords = useMemo(() => {
    if (slotsWithCoords && slotsWithCoords.length > 0) {
      return slotsWithCoords.map((s) => ({
        positionCode: s.positionCode,
        x: (s.x / 100) * viewBoxW,
        y: ((100 - s.y) / 100) * viewBoxH,
        data: s,
      }));
    }
    const coords = getSlotCoordinates(formation);
    const slotByCode = new Map<string, SlotCount | SlotWithCoords>(slots.map((s) => [s.positionCode, s]));
    return coords.map(({ positionCode, x, y }) => ({
      positionCode,
      x,
      y,
      data: slotByCode.get(positionCode) ?? { positionCode, label: positionCode, count: 0, playerIds: [] },
    }));
  }, [formation, slots, slotsWithCoords]);

  const pitchFill = "rgb(34, 139, 34)";
  const canAssign = Boolean(onAssignSlot && slotKeys.length === slotCoords.length);

  const handleSlotClick = (index: number, positionCode: string) => {
    if (canAssign && slotKeys[index]) {
      setAssignDialog({ slotKey: slotKeys[index], positionCode });
    } else {
      onSelectPosition(selectedPositionCode === positionCode ? null : positionCode);
    }
  };

  const handleAssign = (playerId: string | null) => {
    if (assignDialog && onAssignSlot) {
      onAssignSlot(assignDialog.slotKey, playerId);
      setAssignDialog(null);
    }
  };

  return (
    <div
      className="relative mx-auto rounded-lg overflow-hidden border-2 border-white shadow-lg h-[600px] w-auto max-w-full"
      style={{
        aspectRatio: `${viewBoxW}/${viewBoxH}`,
        backgroundColor: pitchFill,
      }}
    >
      <svg
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
        className="w-full h-full rounded-lg"
        style={{ backgroundColor: pitchFill }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Murawa */}
        <rect width="600" height="900" fill={pitchFill} />
        {/* Linia środkowa */}
        <line x1="0" y1={pitch.halfwayY} x2="600" y2={pitch.halfwayY} stroke="white" strokeWidth="4" />
        {/* Koło środkowe */}
        <circle cx={pitch.centerX} cy={pitch.halfwayY} r={pitch.centerCircleR} fill="none" stroke="white" strokeWidth="4" />
        {/* Pola karne */}
        <rect x={pitch.penaltyTop.x} y={pitch.penaltyTop.y} width={pitch.penaltyTop.width} height={pitch.penaltyTop.height} fill="none" stroke="white" strokeWidth="4" />
        <rect x={pitch.penaltyBottom.x} y={pitch.penaltyBottom.y} width={pitch.penaltyBottom.width} height={pitch.penaltyBottom.height} fill="none" stroke="white" strokeWidth="4" />
        {/* Pola bramkowe */}
        <rect x={pitch.goalAreaTop.x} y={pitch.goalAreaTop.y} width={pitch.goalAreaTop.width} height={pitch.goalAreaTop.height} fill="none" stroke="white" strokeWidth="3" />
        <rect x={pitch.goalAreaBottom.x} y={pitch.goalAreaBottom.y} width={pitch.goalAreaBottom.width} height={pitch.goalAreaBottom.height} fill="none" stroke="white" strokeWidth="3" />
        {/* Punkty karne */}
        <circle cx={pitch.centerX} cy={pitch.penaltySpotTopY} r="3" fill="white" />
        <circle cx={pitch.centerX} cy={pitch.penaltySpotBottomY} r="3" fill="white" />
        {/* Bramki (symbol) */}
        <rect x={pitch.centerX - pitch.goalSymbolWidth / 2} y="0" width={pitch.goalSymbolWidth} height={pitch.goalSymbolHeight} fill="none" stroke="white" strokeWidth="2" />
        <rect x={pitch.centerX - pitch.goalSymbolWidth / 2} y={viewBoxH - pitch.goalSymbolHeight} width={pitch.goalSymbolWidth} height={pitch.goalSymbolHeight} fill="none" stroke="white" strokeWidth="2" />

        {slotCoords.map(({ positionCode, x, y, data }, index) => {
          const count = data.count ?? 0;
          const playerIds = data.playerIds ?? [];
          const names = playerIds.map((id) => memberNames[id] ?? "?").join(", ");
          const isSelected = selectedPositionCode === positionCode;
          return (
            <g
              key={`${positionCode}-${x}-${y}`}
              onClick={() => handleSlotClick(index, positionCode)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r="36"
                className={`fill-current stroke-2 transition-all ${slotColor(count)} ${isSelected ? "ring-4 ring-primary ring-offset-2" : ""}`}
                stroke="white"
                strokeWidth="2"
              />
              <text x={x} y={y - 6} textAnchor="middle" className="text-sm font-bold fill-current">
                {positionCode}
              </text>
              <text x={x} y={y + 12} textAnchor="middle" className="text-xs font-bold fill-current">
                ({count})
              </text>
              <title>{names || `Brak zawodników`}</title>
            </g>
          );
        })}
      </svg>

      <Dialog open={Boolean(assignDialog)} onOpenChange={(o) => !o && setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Przypisz zawodnika do slotu {assignDialog?.positionCode ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {allMemberIds.map((playerId, index) => (
              <Button
                key={`assign-${playerId}-${index}`}
                variant="outline"
                className="justify-start text-left font-normal"
                onClick={() => handleAssign(playerId)}
              >
                {memberNames[playerId] ?? playerId}
              </Button>
            ))}
            <Button
              key="assign-clear"
              variant="ghost"
              className="text-slate-600"
              onClick={() => handleAssign(null)}
            >
              Usuń przypisanie
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {benchPlayerIds.length > 0 && (
        <div className="mt-3 rounded bg-slate-800/90 text-white p-2 text-sm">
          <div className="font-semibold mb-1">Ławka rezerwowa ({benchPlayerIds.length}):</div>
          <ul className="list-disc list-inside space-y-0.5">
            {benchPlayerIds.slice(0, 10).map((id) => (
              <li key={id}>{memberNames[id] ?? id}</li>
            ))}
            {benchPlayerIds.length > 10 && <li>… +{benchPlayerIds.length - 10}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
