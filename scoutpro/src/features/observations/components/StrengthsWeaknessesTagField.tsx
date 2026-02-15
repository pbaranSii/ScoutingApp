import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import type { TagOption } from "./TagSelectModal";
import { TagSelectModal } from "./TagSelectModal";

type StrengthsWeaknessesTagFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dictionaryOptions: TagOption[];
};

function parseItems(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pole tylko na tagi (wybór ze słownika). Opis tekstowy jest w osobnym polu. */
export function StrengthsWeaknessesTagField({
  label,
  value,
  onChange,
  dictionaryOptions,
}: StrengthsWeaknessesTagFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const items = parseItems(value);

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
      <div className="flex flex-wrap items-center gap-2">
        <FormLabel className="mb-0">{label}</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="h-8"
        >
          Dodaj tag
        </Button>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm"
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
      ) : (
        <p className="text-sm text-slate-500">Brak wybranych tagów. Kliknij „Dodaj tag”, aby wybrać z listy.</p>
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
