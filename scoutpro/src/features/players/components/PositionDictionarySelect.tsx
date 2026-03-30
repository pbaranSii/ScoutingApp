import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePositionDictionary } from "@/features/tactical/hooks/usePositionDictionary";
import type { PositionDictionaryRow } from "@/features/tactical/types";
import { mapLegacyPosition } from "@/features/players/positions";

/** Map legacy primary_position (e.g. CDM, CAM) to position_dictionary code (DM, AM) for matching. */
export function codeForLookup(code: string | null | undefined): string {
  if (!code?.trim()) return "";
  const trimmed = code.trim();
  const legacy = mapLegacyPosition(trimmed);
  const alias: Record<string, string> = { CDM: "DM", CAM: "AM" };
  return alias[legacy] ?? legacy;
}

/** Resolve primary_position (code or legacy) to first matching position_dictionary id. */
export function getPositionIdFromCode(
  positions: PositionDictionaryRow[],
  primaryPosition: string | null | undefined
): string {
  const lookup = codeForLookup(primaryPosition);
  if (!lookup) return "";
  const found = positions.find(
    (p) => p.position_code === lookup || p.position_code === primaryPosition?.trim()
  );
  return found?.id ?? "";
}

type PositionDictionarySelectProps = {
  value: string;
  onChange: (positionCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** When true, show only active positions (default true). */
  activeOnly?: boolean;
  className?: string;
};

/** Select pozycji ze słownika Ustawienia -> Schematy taktyczne -> Słownik pozycji. Wartość to position_code (zapis do primary_position / positions). */
export function PositionDictionarySelect({
  value,
  onChange,
  placeholder = "Wybierz pozycję",
  disabled = false,
  activeOnly = true,
  className,
}: PositionDictionarySelectProps) {
  const { data: positions = [], isLoading } = usePositionDictionary(activeOnly);
  const selectedId = getPositionIdFromCode(positions, value);

  const handleChange = (id: string) => {
    const pos = positions.find((p) => p.id === id);
    if (pos) onChange(pos.position_code);
  };

  if (isLoading) {
    return (
      <Select value="" disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Ładowanie…" />
        </SelectTrigger>
        <SelectContent />
      </Select>
    );
  }

  return (
    <Select
      value={selectedId || "__none__"}
      onValueChange={(v) => {
        if (v === "__none__") onChange("");
        else handleChange(v);
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— Brak —</SelectItem>
        {positions.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.position_number > 0
              ? `${p.position_number} – ${p.position_code} – ${p.position_name_pl}`
              : `${p.position_code} – ${p.position_name_pl}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Option type for multi-select (additional positions): value = position_code, id = unique key. */
export function getPositionOptionsFromDictionary(positions: PositionDictionaryRow[]) {
  return positions.map((p) => ({
    id: p.id,
    value: p.position_code,
    label:
      p.position_number > 0
        ? `${p.position_number} – ${p.position_code} – ${p.position_name_pl}`
        : `${p.position_code} – ${p.position_name_pl}`,
  }));
}

/** Resolve position_code to display label from dictionary. */
export function getPositionLabelFromDictionary(
  positions: PositionDictionaryRow[],
  code: string | null | undefined
): string {
  if (!code?.trim()) return "—";
  const lookup = codeForLookup(code);
  const pos = positions.find((p) => p.position_code === lookup || p.position_code === code?.trim());
  return pos ? `${pos.position_code} – ${pos.position_name_pl}` : code;
}
