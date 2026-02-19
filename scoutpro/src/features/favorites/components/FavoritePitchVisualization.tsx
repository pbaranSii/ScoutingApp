import { useMemo } from "react";
import type { FormationCode } from "../types";
import { getFormationSlots } from "../utils/formations";
import type { SlotCount } from "../utils/formations";

type FavoritePitchVisualizationProps = {
  formation: FormationCode;
  slots: SlotCount[];
  benchPlayerIds: string[];
  memberNames: Record<string, string>;
  selectedPositionCode: string | null;
  onSelectPosition: (positionCode: string | null) => void;
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
  benchPlayerIds,
  memberNames,
  selectedPositionCode,
  onSelectPosition,
}: FavoritePitchVisualizationProps) {
  const slotCoords = useMemo(() => getSlotCoordinates(formation), [formation]);
  const slotByCode = useMemo(() => {
    const map = new Map<string, SlotCount>();
    for (const s of slots) {
      map.set(s.positionCode, s);
    }
    return map;
  }, [slots]);

  return (
    <div className="relative w-full max-w-[280px] mx-auto lg:max-w-full max-h-[min(55vh,420px)] lg:max-h-[min(50vh,380px)]">
      <svg
        viewBox="0 0 600 900"
        className="w-full h-full min-h-0 rounded-lg overflow-hidden border-2 border-white shadow-lg"
        style={{ aspectRatio: "600/900", backgroundColor: "#22c55e" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Murawa */}
        <rect width="600" height="900" fill="#22c55e" />
        {/* Linia środkowa */}
        <line x1="0" y1="450" x2="600" y2="450" stroke="white" strokeWidth="4" />
        {/* Koło środkowe */}
        <circle cx="300" cy="450" r="78" fill="none" stroke="white" strokeWidth="4" />
        {/* Pole karne – górna bramka (viewBox: width 600, height 900, y rośnie w dół) */}
        <rect x="74" y="0" width="452" height="346" fill="none" stroke="white" strokeWidth="4" />
        {/* Pole karne – dolna bramka */}
        <rect x="74" y="554" width="452" height="346" fill="none" stroke="white" strokeWidth="4" />
        {/* Pole bramkowe – górna bramka */}
        <rect x="171" y="0" width="258" height="47" fill="none" stroke="white" strokeWidth="3" />
        {/* Pole bramkowe – dolna bramka */}
        <rect x="171" y="853" width="258" height="47" fill="none" stroke="white" strokeWidth="3" />

        {slotCoords.map(({ positionCode, x, y }) => {
          const data = slotByCode.get(positionCode);
          const count = data?.count ?? 0;
          const playerIds = data?.playerIds ?? [];
          const names = playerIds.map((id) => memberNames[id] ?? "?").join(", ");
          const isSelected = selectedPositionCode === positionCode;
          return (
            <g
              key={positionCode}
              onClick={() => onSelectPosition(selectedPositionCode === positionCode ? null : positionCode)}
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
