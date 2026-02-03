export type PositionOption = {
  code: string;
  label: string;
};

export const POSITION_OPTIONS: PositionOption[] = [
  { code: "GK", label: "Bramkarz" },
  { code: "LB", label: "Obrońca lewy" },
  { code: "LCB", label: "Środkowy obrońca lewy" },
  { code: "CB", label: "Środkowy obrońca" },
  { code: "RCB", label: "Środkowy obrońca prawy" },
  { code: "RB", label: "Obrońca prawy" },
  { code: "CDM", label: "Defensywny pomocnik" },
  { code: "LM", label: "Pomocnik lewy" },
  { code: "CM", label: "Pomocnik środkowy" },
  { code: "RM", label: "Pomocnik prawy" },
  { code: "CAM", label: "Ofensywny pomocnik" },
  { code: "LW", label: "Skrzydłowy lewy" },
  { code: "RW", label: "Skrzydłowy prawy" },
  { code: "LS", label: "Napastnik lewy" },
  { code: "ST", label: "Napastnik środkowy" },
  { code: "RS", label: "Napastnik prawy" },
];

const POSITION_LABELS = POSITION_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.code] = option.label;
  return acc;
}, {});

const LEGACY_POSITION_MAP: Record<string, string> = {
  "1": "GK",
  "2": "RB",
  "3": "LB",
  "4": "CB",
  "6": "CDM",
  "7": "RW",
  "8": "CM",
  "9": "ST",
  "10": "CAM",
  "11": "LW",
};

export const mapLegacyPosition = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  return LEGACY_POSITION_MAP[trimmed] ?? trimmed;
};

export const formatPosition = (value?: string | null) => {
  if (!value) return "-";
  const normalized = mapLegacyPosition(value);
  const label = POSITION_LABELS[normalized];
  return label ? `${label} (${normalized})` : normalized;
};
