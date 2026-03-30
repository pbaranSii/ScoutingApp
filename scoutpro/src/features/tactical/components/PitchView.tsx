import type { EditableSlot, SlotDepth } from "../types";
import { getPitchMarkings } from "@/components/pitch/pitchConstants";

const DEPTH_COLORS: Record<SlotDepth, { fill: string; stroke: string }> = {
  GK: { fill: "#fde047", stroke: "#ca8a04" },
  DEF: { fill: "#93c5fd", stroke: "#2563eb" },
  MID: { fill: "#86efac", stroke: "#16a34a" },
  ATT: { fill: "#fca5a5", stroke: "#dc2626" },
};

type PitchViewProps = {
  slots: EditableSlot[];
  selectedSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  onDrop?: (x: number, y: number) => void;
  readOnly?: boolean;
  /** Map 0-100 to pixel. Default 400x600 area. */
  width?: number;
  height?: number;
};

export function PitchView({
  slots,
  selectedSlotIndex,
  onSelectSlot,
  onDrop,
  readOnly = false,
  width = 400,
  height = 600,
}: PitchViewProps) {
  const scaleX = (v: number) => (v / 100) * width;
  const scaleY = (v: number) => (v / 100) * height;
  const pitch = getPitchMarkings(width, height);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onDrop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, Math.round(x / 5) * 5));
    const clampedY = Math.max(0, Math.min(100, Math.round(y / 5) * 5));
    onDrop(clampedX, 100 - clampedY);
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-emerald-700/20 p-2">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="aspect-[2/3] max-h-[70vh] w-full"
        style={{ maxWidth: width }}
        onPointerDown={handlePointerDown}
      >
        {/* Murawa */}
        <rect x={0} y={0} width={width} height={height} fill="rgb(34, 139, 34)" stroke="white" strokeWidth={2} />
        {/* Linia środkowa */}
        <line x1={0} y1={pitch.halfwayY} x2={width} y2={pitch.halfwayY} stroke="white" strokeWidth={2} opacity={0.9} />
        {/* Koło środkowe */}
        <circle cx={pitch.centerX} cy={pitch.halfwayY} r={pitch.centerCircleR} fill="none" stroke="white" strokeWidth={2} opacity={0.9} />
        {/* Pola karne */}
        <rect x={pitch.penaltyTop.x} y={pitch.penaltyTop.y} width={pitch.penaltyTop.width} height={pitch.penaltyTop.height} fill="none" stroke="white" strokeWidth={2} />
        <rect x={pitch.penaltyBottom.x} y={pitch.penaltyBottom.y} width={pitch.penaltyBottom.width} height={pitch.penaltyBottom.height} fill="none" stroke="white" strokeWidth={2} />
        {/* Pola bramkowe */}
        <rect x={pitch.goalAreaTop.x} y={pitch.goalAreaTop.y} width={pitch.goalAreaTop.width} height={pitch.goalAreaTop.height} fill="none" stroke="white" strokeWidth={1.5} />
        <rect x={pitch.goalAreaBottom.x} y={pitch.goalAreaBottom.y} width={pitch.goalAreaBottom.width} height={pitch.goalAreaBottom.height} fill="none" stroke="white" strokeWidth={1.5} />
        {/* Punkty karne */}
        <circle cx={pitch.centerX} cy={pitch.penaltySpotTopY} r={2} fill="white" />
        <circle cx={pitch.centerX} cy={pitch.penaltySpotBottomY} r={2} fill="white" />
        {/* Bramki */}
        <rect x={pitch.centerX - pitch.goalSymbolWidth / 2} y={0} width={pitch.goalSymbolWidth} height={pitch.goalSymbolHeight} fill="none" stroke="white" strokeWidth={1.5} />
        <rect x={pitch.centerX - pitch.goalSymbolWidth / 2} y={height - pitch.goalSymbolHeight} width={pitch.goalSymbolWidth} height={pitch.goalSymbolHeight} fill="none" stroke="white" strokeWidth={1.5} />
        {/* Sloty – y w bazie: 0 = własna bramka (GK), 100 = atak; odwracamy Y żeby GK na dole */}
        {slots.map((slot, index) => {
          const sx = scaleX(slot.x);
          const sy = scaleY(100 - slot.y);
          const isSelected = selectedSlotIndex === index;
          const colors = DEPTH_COLORS[slot.depth] ?? { fill: "#e2e8f0", stroke: "#64748b" };
          return (
            <g
              key={slot.id ?? `new-${index}`}
              className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onSelectSlot(index); }}
            >
              <circle
                cx={sx}
                cy={sy}
                r={18}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isSelected ? 3 : 2}
              />
              <text
                x={sx}
                y={sy}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-bold fill-slate-900"
              >
                {slot.position_code ?? "?"}
              </text>
              {slot.slot_label && slot.slot_label !== (slot.position_code ?? "") && (
                <text
                  x={sx}
                  y={sy + 22}
                  textAnchor="middle"
                  className="text-[10px] fill-white"
                >
                  {slot.slot_label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-xs text-slate-600">
        {readOnly ? "Kliknij slot, aby podglądać" : "Kliknij boisko, aby dodać slot (snap 5). Kliknij slot, aby edytować."}
      </p>
    </div>
  );
}
