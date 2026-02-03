import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POSITION_OPTIONS } from "@/features/players/positions";

type PositionPickerDialogProps = {
  value?: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
  buttonLabel?: string;
};

type PositionCoordinate = {
  code: string;
  left: string;
  top: string;
};

const POSITION_COORDINATES: PositionCoordinate[] = [
  { code: "LS", left: "38%", top: "10%" },
  { code: "ST", left: "50%", top: "10%" },
  { code: "RS", left: "62%", top: "10%" },
  { code: "LW", left: "18%", top: "22%" },
  { code: "RW", left: "82%", top: "22%" },
  { code: "CAM", left: "50%", top: "36%" },
  { code: "LM", left: "18%", top: "50%" },
  { code: "CM", left: "50%", top: "50%" },
  { code: "RM", left: "82%", top: "50%" },
  { code: "CDM", left: "50%", top: "62%" },
  { code: "LB", left: "18%", top: "75%" },
  { code: "LCB", left: "38%", top: "75%" },
  { code: "CB", left: "50%", top: "75%" },
  { code: "RCB", left: "62%", top: "75%" },
  { code: "RB", left: "82%", top: "75%" },
  { code: "GK", left: "50%", top: "88%" },
];

export function PositionPickerDialog({
  value,
  onSelect,
  disabled,
  buttonLabel = "Wybierz na boisku",
}: PositionPickerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const labels = useMemo(() => {
    return POSITION_OPTIONS.reduce<Record<string, string>>((acc, option) => {
      acc[option.code] = option.label;
      return acc;
    }, {});
  }, []);

  const handleSelect = (code: string) => {
    onSelect(code);
    setIsOpen(false);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      {isMounted &&
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
                <h2 className="text-lg font-semibold">Wybierz pozycje na boisku</h2>
                <p className="text-sm text-slate-500">Kliknij na pozycje, aby ja ustawic.</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-emerald-700">
                  <div className="absolute inset-4 border-2 border-white" />
                  <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white" />
                  <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
                  <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                  <div className="absolute left-1/2 top-[12%] h-16 w-28 -translate-x-1/2 border-2 border-white" />
                  <div className="absolute left-1/2 bottom-[12%] h-16 w-28 -translate-x-1/2 border-2 border-white" />
                  <div className="absolute left-1/2 top-[4%] h-6 w-16 -translate-x-1/2 border-2 border-white" />
                  <div className="absolute left-1/2 bottom-[4%] h-6 w-16 -translate-x-1/2 border-2 border-white" />
                  <div className="absolute left-1/2 top-[26%] h-2 w-2 -translate-x-1/2 rounded-full bg-white" />
                  <div className="absolute left-1/2 bottom-[26%] h-2 w-2 -translate-x-1/2 rounded-full bg-white" />

                  {POSITION_COORDINATES.map((position) => {
                    const label = labels[position.code] ?? position.code;
                    const isActive = value === position.code;
                    return (
                      <button
                        key={position.code}
                        type="button"
                        title={`${label} (${position.code})`}
                        onClick={() => handleSelect(position.code)}
                        className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold shadow-sm transition ${
                          isActive
                            ? "border-white bg-red-600 text-white"
                            : "border-white bg-slate-100 text-slate-900 hover:bg-white"
                        }`}
                        style={{ left: position.left, top: position.top }}
                      >
                        {position.code}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-slate-500">
                  Kliknij na pozycje na boisku, aby ja wybrac.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
