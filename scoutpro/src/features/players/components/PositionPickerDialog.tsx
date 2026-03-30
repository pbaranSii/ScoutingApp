import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POSITION_OPTIONS } from "@/features/players/positions";
import { useDefaultFormation } from "@/features/tactical/hooks/useFormations";
import { codeForLookup } from "@/features/players/components/PositionDictionarySelect";
import { getPitchMarkings } from "@/components/pitch/pitchConstants";

type PositionPickerDialogProps = {
  value?: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
  buttonLabel?: string;
};

type PositionCoordinate = {
  id: string;
  code: string;
  label: string;
  left: string;
  top: string;
};

/** Fallback when no default formation is set – klasyczny układ pozycji. */
const FALLBACK_COORDINATES: PositionCoordinate[] = [
  { id: "ls", code: "LS", label: "Napastnik lewy", left: "38%", top: "10%" },
  { id: "st", code: "ST", label: "Napastnik środkowy", left: "50%", top: "10%" },
  { id: "rs", code: "RS", label: "Napastnik prawy", left: "62%", top: "10%" },
  { id: "lw", code: "LW", label: "Skrzydłowy lewy", left: "18%", top: "22%" },
  { id: "rw", code: "RW", label: "Skrzydłowy prawy", left: "82%", top: "22%" },
  { id: "cam", code: "CAM", label: "Ofensywny pomocnik", left: "50%", top: "36%" },
  { id: "lm", code: "LM", label: "Pomocnik lewy", left: "18%", top: "50%" },
  { id: "cm", code: "CM", label: "Pomocnik środkowy", left: "50%", top: "50%" },
  { id: "rm", code: "RM", label: "Pomocnik prawy", left: "82%", top: "50%" },
  { id: "cdm", code: "CDM", label: "Defensywny pomocnik", left: "50%", top: "62%" },
  { id: "lb", code: "LB", label: "Obrońca lewy", left: "18%", top: "75%" },
  { id: "lcb", code: "LCB", label: "Środkowy obrońca lewy", left: "38%", top: "75%" },
  { id: "cb", code: "CB", label: "Środkowy obrońca", left: "50%", top: "75%" },
  { id: "rcb", code: "RCB", label: "Środkowy obrońca prawy", left: "62%", top: "75%" },
  { id: "rb", code: "RB", label: "Obrońca prawy", left: "82%", top: "75%" },
  { id: "gk", code: "GK", label: "Bramkarz", left: "50%", top: "88%" },
];

const VIEW_W = 600;
const VIEW_H = 900;

function PitchSvg() {
  const p = getPitchMarkings(VIEW_W, VIEW_H);
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={VIEW_W} height={VIEW_H} fill="currentColor" className="text-[#166534]" />
      <line x1={0} y1={p.halfwayY} x2={VIEW_W} y2={p.halfwayY} stroke="white" strokeWidth="3" />
      <circle cx={p.centerX} cy={p.halfwayY} r={p.centerCircleR} fill="none" stroke="white" strokeWidth="3" />
      <rect x={p.penaltyTop.x} y={p.penaltyTop.y} width={p.penaltyTop.width} height={p.penaltyTop.height} fill="none" stroke="white" strokeWidth="3" />
      <rect x={p.penaltyBottom.x} y={p.penaltyBottom.y} width={p.penaltyBottom.width} height={p.penaltyBottom.height} fill="none" stroke="white" strokeWidth="3" />
      <rect x={p.goalAreaTop.x} y={p.goalAreaTop.y} width={p.goalAreaTop.width} height={p.goalAreaTop.height} fill="none" stroke="white" strokeWidth="2" />
      <rect x={p.goalAreaBottom.x} y={p.goalAreaBottom.y} width={p.goalAreaBottom.width} height={p.goalAreaBottom.height} fill="none" stroke="white" strokeWidth="2" />
      <circle cx={p.centerX} cy={p.penaltySpotTopY} r={2.5} fill="white" />
      <circle cx={p.centerX} cy={p.penaltySpotBottomY} r={2.5} fill="white" />
      <rect x={p.centerX - p.goalSymbolWidth / 2} y={0} width={p.goalSymbolWidth} height={p.goalSymbolHeight} fill="none" stroke="white" strokeWidth="2" />
      <rect x={p.centerX - p.goalSymbolWidth / 2} y={VIEW_H - p.goalSymbolHeight} width={p.goalSymbolWidth} height={p.goalSymbolHeight} fill="none" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function PositionPickerDialog({
  value,
  onSelect,
  disabled,
  buttonLabel = "Wybierz na boisku",
}: PositionPickerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canUseDom = typeof document !== "undefined";
  const { data: defaultFormation, isLoading: formationLoading } = useDefaultFormation();

  const positionCoordinates = useMemo((): PositionCoordinate[] => {
    if (defaultFormation?.tactical_slots?.length) {
      return defaultFormation.tactical_slots.map((slot, idx) => {
        const pos = (slot as { position_dictionary?: { position_code: string; position_name_pl: string } | null })
          .position_dictionary;
        const code = pos?.position_code ?? "?";
        const label = pos?.position_name_pl ?? code;
        const s = slot as { x: number; y: number };
        return {
          id: (slot as { id?: string }).id ?? `slot-${idx}`,
          code,
          label,
          left: `${s.x}%`,
          top: `${100 - s.y}%`,
        };
      });
    }
    return FALLBACK_COORDINATES;
  }, [defaultFormation]);

  const labelsByCode = useMemo(() => {
    const map: Record<string, string> = {};
    POSITION_OPTIONS.forEach((o) => {
      map[o.code] = o.label;
    });
    positionCoordinates.forEach((p) => {
      if (!map[p.code]) map[p.code] = p.label;
    });
    return map;
  }, [positionCoordinates]);

  const handleSelect = (code: string) => {
    onSelect(code);
    setIsOpen(false);
  };

  const isPositionActive = (code: string) => {
    if (!value) return false;
    const normalized = codeForLookup(value);
    return value === code || normalized === code;
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="h-10"
        onClick={() => setIsOpen(true)}
      >
        {buttonLabel}
      </Button>
      {canUseDom &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="relative z-[71] w-[min(560px,90vw)] rounded-lg bg-white p-5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setIsOpen(false)}
                aria-label="Zamknij"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Wybierz pozycję na boisku</h2>
                <p className="text-sm text-slate-500">
                  {defaultFormation
                    ? `Schemat: ${defaultFormation.name} (${defaultFormation.code})`
                    : "Kliknij na pozycję, aby ją ustawić."}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="relative aspect-[2/3] w-full max-h-[380px] max-w-[253px] mx-auto overflow-hidden rounded-xl bg-[#166534]">
                  <PitchSvg />
                  {formationLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                      Ładowanie schematu…
                    </div>
                  ) : (
                    positionCoordinates.map((position) => {
                      const label = labelsByCode[position.code] ?? position.label;
                      const isActive = isPositionActive(position.code);
                      return (
                        <button
                          key={position.id}
                          type="button"
                          title={`${label} (${position.code})`}
                          onClick={() => handleSelect(position.code)}
                          className={`absolute flex h-10 w-10 min-w-[2.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold shadow-sm transition ${
                            isActive
                              ? "border-white bg-red-600 text-white"
                              : "border-white bg-slate-100 text-slate-900 hover:bg-white"
                          }`}
                          style={{ left: position.left, top: position.top }}
                        >
                          {position.code}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-center text-xs text-slate-500">
                  Kliknij na pozycję na boisku, aby ją wybrać. Układ z Ustawienia → Schematy taktyczne (domyślny).
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
