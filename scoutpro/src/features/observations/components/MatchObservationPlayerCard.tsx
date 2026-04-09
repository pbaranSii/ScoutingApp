import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePositionDictionary } from "@/features/tactical/hooks/usePositionDictionary";
import { getPositionIdFromCode, getPositionOptionsFromDictionary } from "@/features/players/components/PositionDictionarySelect";
import { ClubSelect } from "@/features/players/components/ClubSelect";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { mapLegacyPosition } from "@/features/players/positions";
import type { MatchPlayerSlot } from "@/features/observations/types";

type MatchObservationPlayerCardProps = {
  slot: MatchPlayerSlot;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  onSave?: (data: Omit<MatchPlayerSlot, "id">) => void;
  onEdit?: () => void;
  onRemove: () => void;
  /** First two options for club select (from header: Gospodarz, Gość). */
  headerTeamNames?: string[];
  /** When true, card only shows summary; click/Edytuj calls onEdit instead of expanding. */
  listView?: boolean;
};

export function MatchObservationPlayerCard({
  slot,
  isExpanded,
  onToggleExpand,
  onSave,
  onEdit,
  onRemove,
  headerTeamNames = [],
  listView = false,
}: MatchObservationPlayerCardProps) {
  const { data: positions = [] } = usePositionDictionary(true);
  const positionOptions = getPositionOptionsFromDictionary(positions);

  const [first_name, setFirst_name] = useState(slot.first_name);
  const [last_name, setLast_name] = useState(slot.last_name);
  const [birth_year, setBirth_year] = useState(slot.birth_year);
  const [birth_date, setBirth_date] = useState(slot.birth_date ?? "");
  const [club_name, setClub_name] = useState(slot.club_name ?? "");
  const [primary_position, setPrimary_position] = useState(slot.primary_position);
  const [match_performance_rating, setMatch_performance_rating] = useState(slot.match_performance_rating);
  const [recommendation, setRecommendation] = useState<MatchPlayerSlot["recommendation"]>(slot.recommendation);
  const [summary, setSummary] = useState(slot.summary);

  const handleSave = () => {
    if (!onSave) return;
    if (!first_name.trim() || !last_name.trim() || !primary_position) return;
    if (summary.trim().length < 10) return;
    onSave({
      player_id: slot.player_id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      birth_year,
      birth_date: birth_date.trim() || undefined,
      club_name: club_name.trim() || undefined,
      primary_position,
      overall_rating: slot.overall_rating,
      match_performance_rating,
      recommendation,
      summary: summary.trim(),
    });
  };

  const summaryLabel =
    slot.first_name || slot.last_name
      ? `${slot.first_name} ${slot.last_name}`.trim() || "Nowy zawodnik"
      : "Nowy zawodnik";
  const positionLabel = slot.primary_position ? mapLegacyPosition(slot.primary_position) : "";
  const clubLabel = slot.club_name?.trim() || "Brak klubu";
  const subLabel = listView
    ? (positionLabel ? `${positionLabel} · ${clubLabel}` : clubLabel) || "Uzupełnij dane"
    : slot.primary_position
      ? `${slot.primary_position} · ${clubLabel} · ${slot.recommendation}`
      : "Uzupełnij dane i zapisz";

  const handleHeaderClick = () => {
    if (listView && onEdit) onEdit();
    else if (onToggleExpand) onToggleExpand();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={handleHeaderClick}
        onKeyDown={(e) => e.key === "Enter" && handleHeaderClick()}
        role="button"
        tabIndex={0}
      >
        <div>
          <div className="font-medium">{summaryLabel}</div>
          <div className="text-sm text-slate-500">{subLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          {listView && onEdit && (
            <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label="Edytuj">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Usuń">
            <Trash2 className="h-4 w-4" />
          </Button>
          {!listView && (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
        </div>
      </div>
      {!listView && isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Imię <span className="text-red-600">*</span></Label>
              <Input value={first_name} onChange={(e) => setFirst_name(e.target.value)} placeholder="Imię" />
            </div>
            <div>
              <Label>Nazwisko <span className="text-red-600">*</span></Label>
              <Input value={last_name} onChange={(e) => setLast_name(e.target.value)} placeholder="Nazwisko" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Rocznik <span className="text-red-600">*</span></Label>
              <Input
                type="number"
                min={2000}
                max={2030}
                value={birth_year}
                onChange={(e) => setBirth_year(Number(e.target.value) || 2008)}
              />
            </div>
            <div>
              <Label>Data urodzenia</Label>
              <Input
                type="date"
                value={birth_date}
                onChange={(e) => setBirth_date(e.target.value)}
                placeholder="RRRR-MM-DD"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Klub</Label>
              <ClubSelect
                value={club_name}
                onChange={setClub_name}
                placeholder="Wpisz lub wybierz klub..."
                priorityNames={headerTeamNames}
              />
            </div>
            <div>
              <Label>Pozycja główna <span className="text-red-600">*</span></Label>
              <Select
                value={getPositionIdFromCode(positions, primary_position) || "__none__"}
                onValueChange={(id) => {
                  if (id === "__none__") setPrimary_position("");
                  else {
                    const p = positions.find((x) => x.id === id);
                    if (p) setPrimary_position(p.position_code);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz pozycję" />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Ocena za występ (1–5) <span className="text-red-600">*</span></Label>
              <Select value={String(match_performance_rating)} onValueChange={(v) => setMatch_performance_rating(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <div>
            <Label>Rekomendacja <span className="text-red-600">*</span></Label>
            <div className="flex gap-2">
              {(["negative", "to_observe", "positive"] as const).map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={recommendation === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecommendation(r)}
                >
                  {r === "positive" ? "Pozytywna" : r === "to_observe" ? "Do obserwacji" : "Negatywna"}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Podsumowanie (min. 10 znaków) <span className="text-red-600">*</span></Label>
            <Textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Opis występu, mocne i słabe strony..."
            />
          </div>
          <Button type="button" onClick={handleSave}>
            Zapisz zawodnika
          </Button>
        </div>
      )}
    </div>
  );
}
