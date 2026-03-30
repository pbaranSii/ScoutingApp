import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DuplicateCandidate } from "@/features/players/api/players.api";
import { formatPosition } from "@/features/players/positions";

type DuplicateWarningDialogProps = {
  open: boolean;
  candidateDisplay: string;
  duplicates: DuplicateCandidate[];
  onSelectExisting: (player: DuplicateCandidate) => void;
  onConfirmNew: () => void;
  onClose: () => void;
};

export function DuplicateWarningDialog({
  open,
  candidateDisplay,
  duplicates,
  onSelectExisting,
  onConfirmNew,
  onClose,
}: DuplicateWarningDialogProps) {
  if (!open) return null;
  const canUseDom = typeof document !== "undefined";
  if (!canUseDom) return null;

  const secondary = (p: DuplicateCandidate) => {
    const parts = [
      p.birth_year,
      p.club?.name ?? "—",
      p.primary_position ? formatPosition(p.primary_position) : "",
    ].filter(Boolean);
    return parts.join(" | ");
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div
        className="relative z-[81] w-full max-w-lg rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-warning-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <h2 id="duplicate-warning-title" className="flex items-center gap-2 text-lg font-semibold text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Znaleziono podobnych zawodników
          </h2>
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b border-slate-200 p-3">
          <p className="text-sm text-slate-600">Wprowadzane dane:</p>
          <p className="font-medium text-slate-900">{candidateDisplay}</p>
        </div>
        <div className="max-h-[40vh] overflow-y-auto p-3">
          <p className="mb-2 text-sm text-slate-600">Potencjalne dopasowania:</p>
          <ul className="space-y-2">
            {duplicates.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        p.score >= 80
                          ? "text-red-600"
                          : p.score >= 60
                            ? "text-amber-600"
                            : "text-yellow-700"
                      }`}
                    >
                      {p.score}% dopasowania
                    </span>
                  </div>
                  <div className="font-medium text-slate-900">
                    {p.first_name} {p.last_name}
                  </div>
                  <div className="text-sm text-slate-500">{secondary(p)}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectExisting(p)}
                >
                  Wybierz
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 p-3">
          <Button type="button" variant="outline" className="w-full" onClick={onConfirmNew}>
            To nowy zawodnik – kontynuuj
          </Button>
          <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onClose}>
            Anuluj
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
