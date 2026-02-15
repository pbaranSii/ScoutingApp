import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TagOption = { id: string; name_pl: string };

type TagSelectModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  instruction: string;
  options: TagOption[];
  selectedNames: string[];
  onConfirm: (selected: string[]) => void;
};

export function TagSelectModal({
  open,
  onClose,
  title,
  instruction,
  options,
  selectedNames,
  onConfirm,
}: TagSelectModalProps) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelected([...selectedNames]);
  }, [open, selectedNames]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  if (!open) return null;

  const canUseDom = typeof document !== "undefined";
  if (!canUseDom) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div
        className="relative z-[71] w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-modal-title"
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          onClick={onClose}
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 id="tag-modal-title" className="pr-8 text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{instruction}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.name_pl);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.name_pl)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                {opt.name_pl}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Zatwierdź
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
