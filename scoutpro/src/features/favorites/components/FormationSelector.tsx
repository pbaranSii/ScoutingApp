import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORMATION_OPTIONS } from "../types";
import type { FormationCode } from "../types";

type FormationSelectorProps = {
  value: FormationCode;
  onChange: (value: FormationCode) => void;
  disabled?: boolean;
};

export function FormationSelector({ value, onChange, disabled }: FormationSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as FormationCode)} disabled={disabled}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Formacja" />
      </SelectTrigger>
      <SelectContent>
        {FORMATION_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
