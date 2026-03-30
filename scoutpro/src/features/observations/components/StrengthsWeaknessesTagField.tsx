import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TagOption } from "./TagSelectModal";
import { TagSelectModal } from "./TagSelectModal";

type StrengthsWeaknessesTagFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dictionaryOptions: TagOption[];
  /** Green for strengths, red for weaknesses. */
  variant?: "strengths" | "weaknesses";
};

function parseItems(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pole tylko na tagi (wybór ze słownika). Opis tekstowy jest w osobnym polu. */
const tagStyles = {
  strengths: "border-emerald-300 bg-emerald-100 text-emerald-800",
  weaknesses: "border-red-300 bg-red-100 text-red-800",
};

export function StrengthsWeaknessesTagField({
  label,
  value,
  onChange,
  dictionaryOptions,
  variant = "strengths",
}: StrengthsWeaknessesTagFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const items = parseItems(value);
  const tagClass = tagStyles[variant];

  const removeItem = (name: string) => {
    const next = items.filter((i) => i !== name);
    onChange(next.join(", "));
  };

  const handleConfirm = (selected: string[]) => {
    onChange(selected.join(", "));
  };

  const selectedNames = parseItems(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="mb-0">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="h-8 ml-auto"
        >
          Dodaj tag
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((name) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm ${tagClass}`}
            >
              {name}
              <button
                type="button"
                onClick={() => removeItem(name)}
                className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                aria-label={`Usuń ${name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <TagSelectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={label === "Mocne strony" ? "Wybierz mocne strony" : "Wybierz słabe strony"}
        instruction="Kliknij tagi, aby dodać lub usunąć z listy."
        options={dictionaryOptions}
        selectedNames={selectedNames}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
