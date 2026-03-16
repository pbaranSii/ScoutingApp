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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  /** When set, called to assign a set of players to a slot. */
  onAssignSlot?: (slotKey: string, playerIds: string[]) => void;
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
  // Tailwind classes for SVG: use fill/stroke (not bg/text).
  if (count === 0) return "fill-red-200 stroke-red-700";
  if (count === 1) return "fill-amber-200 stroke-amber-700";
  if (count >= 2 && count <= 3) return "fill-green-200 stroke-green-700";
  return "fill-blue-200 stroke-blue-700";
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
  const [assignDialog, setAssignDialog] = useState<{
    slotKey: string;
    positionCode: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
    const isSelected = selectedPositionCode === positionCode;
    // First click selects (filters). Second click on the same slot opens assign dialog (if enabled).
    if (!isSelected) {
      onSelectPosition(positionCode);
      return;
    }
    if (canAssign && slotKeys[index]) {
      const data = slotCoords[index]?.data as SlotCount | SlotWithCoords;
      const initialIds = (data?.playerIds ?? []) as string[];
      setAssignDialog({ slotKey: slotKeys[index], positionCode });
      setSelectedIds(initialIds);
      return;
    }
    onSelectPosition(null);
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
                className={`transition-all ${slotColor(count)} ${isSelected ? "ring-4 ring-primary ring-offset-2" : ""}`}
                strokeWidth="3"
              />
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                className="text-sm font-bold fill-slate-900"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {positionCode}
              </text>
              <text
                x={x}
                y={y + 12}
                textAnchor="middle"
                className="text-xs font-bold fill-slate-900"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                ({count})
              </text>
              <title>{names || `Brak zawodników`}</title>
            </g>
          );
        })}
      </svg>

      <Dialog
        open={Boolean(assignDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignDialog(null);
            setSelectedIds([]);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Zamknij"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
          <DialogHeader className="pr-8">
            <DialogTitle className="text-left">
              Przypisz zawodnika do slotu {assignDialog?.positionCode ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto mt-2">
            {allMemberIds.map((playerId, index) => {
              const isSelected = selectedIds.includes(playerId);
              const playerName = memberNames[playerId] ?? playerId;
              return (
                <Button
                  key={`assign-${playerId}-${index}`}
                  variant={isSelected ? "default" : "outline"}
                  className="justify-start text-left font-normal"
                  onClick={() =>
                    setSelectedIds((prev) =>
                      prev.includes(playerId)
                        ? prev.filter((id) => id !== playerId)
                        : [...prev, playerId]
                    )
                  }
                >
                  <div className="flex flex-col items-start">
                    <span>{playerName}</span>
                    {/* Informacja o pozycji zawodnika – jeżeli nazwa pozycji jest częścią nazwy, można tu ją dodatkowo wyróżnić */}
                  </div>
                </Button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssignDialog(null);
                  setSelectedIds([]);
                }}
              >
                Anuluj
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                if (assignDialog && onAssignSlot) {
                  onAssignSlot(assignDialog.slotKey, selectedIds);
                }
                setAssignDialog(null);
                setSelectedIds([]);
              }}
            >
              Zapisz
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
