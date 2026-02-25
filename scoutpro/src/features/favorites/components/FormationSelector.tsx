import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormations, useDefaultFormation } from "@/features/tactical/hooks/useFormations";
import type { FormationCode } from "../types";

export type FormationSelection = {
  formation_id: string | null;
  formation: string;
};

type FormationSelectorProps = {
  value: FormationSelection;
  onChange: (value: FormationSelection) => void;
  disabled?: boolean;
};

export function FormationSelector({ value, onChange, disabled }: FormationSelectorProps) {
  const { data: formations = [] } = useFormations();
  const { data: defaultFormation } = useDefaultFormation();
  const defaultId = defaultFormation?.id ?? null;

  const orderedFormations = React.useMemo(() => {
    if (!defaultId) return formations;
    const def = formations.find((f) => f.id === defaultId);
    const rest = formations.filter((f) => f.id !== defaultId);
    return def ? [def, ...rest] : formations;
  }, [formations, defaultId]);

  const selectValue =
    value.formation_id ??
    (value.formation ? formations.find((f) => f.code === value.formation)?.id : null) ??
    defaultId ??
    "__none";

  const handleChange = (v: string) => {
    if (!v || v === "__none") return;
    const f = formations.find((x) => x.id === v);
    if (f) onChange({ formation_id: f.id, formation: f.code });
    else onChange({ formation_id: null, formation: "4-4-2" });
  };

  return (
    <Select
      value={selectValue || (defaultId ?? "__none")}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className="min-w-[260px] w-[280px]">
        <SelectValue placeholder="Schemat taktyczny" />
      </SelectTrigger>
      <SelectContent>
        {orderedFormations.length === 0 ? (
          <SelectItem value="__none" disabled>
            Brak schematów – dodaj w Ustawienia → Schematy taktyczne
          </SelectItem>
        ) : (
          orderedFormations.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name} ({f.code}){f.id === defaultId ? " · domyślny" : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
