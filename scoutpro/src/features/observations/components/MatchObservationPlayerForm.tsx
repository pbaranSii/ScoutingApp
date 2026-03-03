import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePositionDictionary } from "@/features/tactical/hooks/usePositionDictionary";
import { getPositionIdFromCode, getPositionOptionsFromDictionary } from "@/features/players/components/PositionDictionarySelect";
import { ClubSelect } from "@/features/players/components/ClubSelect";
import { useStrengths, useWeaknesses } from "@/features/dictionaries/hooks/useDictionaries";
import { StrengthsWeaknessesTagField } from "./StrengthsWeaknessesTagField";
import { PlayerSearchDialog } from "./PlayerSearchDialog";
import { DuplicateWarningDialog } from "./DuplicateWarningDialog";
import { checkDuplicatePlayers, type DuplicateCandidate } from "@/features/players/api/players.api";
import type { PlayerSearchItem } from "@/features/players/api/players.api";
import { mapLegacyPosition } from "@/features/players/positions";
import type { MatchPlayerSlot } from "@/features/observations/types";

const DEFAULT_BIRTH_YEAR = 2010;
const CURRENT_YEAR = new Date().getFullYear();

export type MatchObservationPlayerFormInitial = Partial<Omit<MatchPlayerSlot, "id">> & { id?: string };

type MatchObservationPlayerFormProps = {
  initialData?: MatchObservationPlayerFormInitial | null;
  onSave: (data: Omit<MatchPlayerSlot, "id">) => void;
  onCancel: () => void;
  headerTeamNames?: string[];
};

const defaultSlotData: Omit<MatchPlayerSlot, "id"> = {
  player_id: undefined,
  first_name: "",
  last_name: "",
  birth_year: DEFAULT_BIRTH_YEAR,
  birth_date: undefined,
  club_name: "",
  primary_position: "",
  overall_rating: 6,
  match_performance_rating: 3,
  recommendation: "to_observe",
  summary: "",
  strengths: "",
  weaknesses: "",
  potential_now: 3,
  potential_future: 3,
};

function toFormState(data: MatchObservationPlayerFormInitial | null | undefined): Omit<MatchPlayerSlot, "id"> {
  if (!data) return { ...defaultSlotData };
  return {
    player_id: data.player_id,
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    birth_year: data.birth_year ?? DEFAULT_BIRTH_YEAR,
    birth_date: data.birth_date ?? undefined,
    club_name: data.club_name ?? "",
    primary_position: data.primary_position ?? "",
    overall_rating: data.overall_rating ?? 6,
    match_performance_rating: data.match_performance_rating ?? 3,
    recommendation: data.recommendation ?? "to_observe",
    summary: data.summary ?? "",
    strengths: data.strengths ?? "",
    weaknesses: data.weaknesses ?? "",
    potential_now: data.potential_now ?? 3,
    potential_future: data.potential_future ?? 3,
  };
}

export function MatchObservationPlayerForm({
  initialData,
  onSave,
  onCancel,
  headerTeamNames = [],
}: MatchObservationPlayerFormProps) {
  const { data: positions = [] } = usePositionDictionary(true);
  const positionOptions = getPositionOptionsFromDictionary(positions);
  const { data: strengthsOptions = [] } = useStrengths();
  const { data: weaknessesOptions = [] } = useWeaknesses();

  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);

  const [player_id, setPlayer_id] = useState<string | undefined>(defaultSlotData.player_id);
  const [first_name, setFirst_name] = useState(defaultSlotData.first_name);
  const [last_name, setLast_name] = useState(defaultSlotData.last_name);
  const [birth_year, setBirth_year] = useState(defaultSlotData.birth_year);
  const [birth_date, setBirth_date] = useState(defaultSlotData.birth_date ?? "");
  const [club_name, setClub_name] = useState(defaultSlotData.club_name ?? "");
  const [primary_position, setPrimary_position] = useState(defaultSlotData.primary_position);
  const [overall_rating, setOverall_rating] = useState(defaultSlotData.overall_rating);
  const [match_performance_rating, setMatch_performance_rating] = useState(defaultSlotData.match_performance_rating);
  const [recommendation, setRecommendation] = useState<MatchPlayerSlot["recommendation"]>(defaultSlotData.recommendation);
  const [summary, setSummary] = useState(defaultSlotData.summary);
  const [strengths, setStrengths] = useState(defaultSlotData.strengths ?? "");
  const [weaknesses, setWeaknesses] = useState(defaultSlotData.weaknesses ?? "");
  const [potential_now, setPotential_now] = useState(defaultSlotData.potential_now ?? 3);
  const [potential_future, setPotential_future] = useState(defaultSlotData.potential_future ?? 3);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const state = toFormState(initialData ?? null);
    setPlayer_id(state.player_id);
    setFirst_name(state.first_name);
    setLast_name(state.last_name);
    setBirth_year(state.birth_year);
    setBirth_date(state.birth_date ?? "");
    setClub_name(state.club_name ?? "");
    setPrimary_position(state.primary_position);
    setOverall_rating(state.overall_rating);
    setMatch_performance_rating(state.match_performance_rating);
    setRecommendation(state.recommendation);
    setSummary(state.summary);
    setStrengths(state.strengths ?? "");
    setWeaknesses(state.weaknesses ?? "");
    setPotential_now(state.potential_now ?? 3);
    setPotential_future(state.potential_future ?? 3);
  }, [initialData]);

  const handleSelectPlayer = useCallback((player: PlayerSearchItem) => {
    setPlayer_id(player.id);
    setFirst_name(player.first_name ?? "");
    setLast_name(player.last_name ?? "");
    setBirth_year(player.birth_year);
    setBirth_date("");
    setClub_name(player.club?.name ?? "");
    setPrimary_position(player.primary_position ? mapLegacyPosition(player.primary_position) : "");
    setSearchDialogOpen(false);
  }, []);

  const handleChangePlayer = useCallback(() => {
    setPlayer_id(undefined);
    setFirst_name("");
    setLast_name("");
    setBirth_year(DEFAULT_BIRTH_YEAR);
    setBirth_date("");
    setClub_name("");
    setPrimary_position("");
    setSearchDialogOpen(true);
  }, []);

  const runDuplicateCheck = useCallback(async (): Promise<boolean> => {
    if (player_id) return true;
    const firstName = first_name.trim();
    const lastName = last_name.trim();
    if (firstName.length < 1 || lastName.length < 1) return true;
    if (birth_year < CURRENT_YEAR - 50 || birth_year > CURRENT_YEAR - 8) return true;
    try {
      const candidates = await checkDuplicatePlayers({
        first_name: firstName,
        last_name: lastName,
        birth_year,
        current_club: club_name?.trim() || undefined,
      });
      const high = candidates.filter((c) => c.score >= 80);
      if (high.length > 0) {
        setDuplicateCandidates(high);
        setDuplicateDialogOpen(true);
        return false;
      }
    } catch {
      // ignore
    }
    return true;
  }, [player_id, first_name, last_name, birth_year, club_name]);

  const handleSelectExistingFromDuplicate = useCallback((player: DuplicateCandidate) => {
    setPlayer_id(player.id);
    setFirst_name(player.first_name ?? "");
    setLast_name(player.last_name ?? "");
    setBirth_year(player.birth_year);
    setClub_name(player.club?.name ?? "");
    setPrimary_position(player.primary_position ? mapLegacyPosition(player.primary_position) : "");
    setDuplicateDialogOpen(false);
    setDuplicateCandidates([]);
  }, []);

  const handleConfirmNewDespiteDuplicates = useCallback(() => {
    setIgnoreDuplicates(true);
    setDuplicateDialogOpen(false);
  }, []);

  const performSave = useCallback(() => {
    const data: Omit<MatchPlayerSlot, "id"> = {
      player_id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      birth_year,
      birth_date: birth_date.trim() || undefined,
      club_name: club_name.trim() || undefined,
      primary_position,
      overall_rating,
      match_performance_rating,
      recommendation,
      summary: summary.trim(),
      strengths: strengths.trim() || undefined,
      weaknesses: weaknesses.trim() || undefined,
      potential_now,
      potential_future,
    };
    onSave(data);
  }, [
    player_id, first_name, last_name, birth_year, birth_date, club_name, primary_position,
    overall_rating, match_performance_rating, recommendation, summary,
    strengths, weaknesses, potential_now, potential_future, onSave,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!first_name.trim()) nextErrors.first_name = "Podaj imię zawodnika.";
    if (!last_name.trim()) nextErrors.last_name = "Podaj nazwisko zawodnika.";
    const minYear = CURRENT_YEAR - 50;
    const maxYear = CURRENT_YEAR - 8;
    if (birth_year < minYear || birth_year > maxYear) {
      nextErrors.birth_year = `Rok urodzenia musi być między ${minYear} a ${maxYear}.`;
    }
    if (birth_date.trim()) {
      const yearFromDate = parseInt(birth_date.trim().slice(0, 4), 10);
      if (!Number.isNaN(yearFromDate) && yearFromDate !== birth_year) {
        nextErrors.birth_date = "Rok z daty urodzenia musi być zgodny z polem Rok urodzenia.";
      }
    }
    if (!primary_position) nextErrors.primary_position = "Wybierz pozycję główną.";
    if (summary.trim().length < 10) {
      nextErrors.summary = "Podsumowanie musi mieć co najmniej 10 znaków.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (player_id || ignoreDuplicates) {
      performSave();
      return;
    }
    const canProceed = await runDuplicateCheck();
    if (!canProceed) return;
    performSave();
  };

  const duplicateCandidateDisplay = `${first_name} ${last_name}, ${birth_year}, ${club_name || "—"}`;

  return (
    <div className="space-y-6">
      <PlayerSearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectPlayer={handleSelectPlayer}
        onAddNew={() => setSearchDialogOpen(false)}
      />
      <DuplicateWarningDialog
        open={duplicateDialogOpen}
        candidateDisplay={duplicateCandidateDisplay}
        duplicates={duplicateCandidates}
        onSelectExisting={handleSelectExistingFromDuplicate}
        onConfirmNew={handleConfirmNewDespiteDuplicates}
        onClose={() => setDuplicateDialogOpen(false)}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-800">1. Dane zawodnika</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setSearchDialogOpen(true)}>
              Wybierz z bazy
            </Button>
            {player_id && (
              <Button type="button" variant="outline" onClick={handleChangePlayer}>
                Zmień zawodnika
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Imię <span className="text-red-600">*</span></Label>
              <Input
                value={first_name}
                onChange={(e) => { setFirst_name(e.target.value); setErrors((prev) => ({ ...prev, first_name: "" })); }}
                placeholder="Imię"
                className={errors.first_name ? "border-red-500" : undefined}
              />
              {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
            </div>
            <div className="space-y-1">
              <Label>Nazwisko <span className="text-red-600">*</span></Label>
              <Input
                value={last_name}
                onChange={(e) => { setLast_name(e.target.value); setErrors((prev) => ({ ...prev, last_name: "" })); }}
                placeholder="Nazwisko"
                className={errors.last_name ? "border-red-500" : undefined}
              />
              {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Rok urodzenia <span className="text-red-600">*</span></Label>
              <Input
                type="number"
                min={CURRENT_YEAR - 50}
                max={CURRENT_YEAR - 8}
                value={birth_year}
                onChange={(e) => { setBirth_year(Number(e.target.value) || DEFAULT_BIRTH_YEAR); setErrors((prev) => ({ ...prev, birth_year: "" })); }}
                className={errors.birth_year ? "border-red-500" : undefined}
              />
              {errors.birth_year && <p className="text-sm text-red-600">{errors.birth_year}</p>}
            </div>
            <div className="space-y-1">
              <Label>Data urodzenia (opcjonalnie)</Label>
              <Input
                type="date"
                value={birth_date}
                onChange={(e) => { setBirth_date(e.target.value); setErrors((prev) => ({ ...prev, birth_date: "" })); }}
                placeholder="RRRR-MM-DD"
                className={errors.birth_date ? "border-red-500" : undefined}
              />
              {errors.birth_date && <p className="text-sm text-red-600">{errors.birth_date}</p>}
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
            <div className="space-y-1">
              <Label>Pozycja główna <span className="text-red-600">*</span></Label>
              <Select
                value={getPositionIdFromCode(positions, primary_position) || "__none__"}
                onValueChange={(id) => {
                  setErrors((prev) => ({ ...prev, primary_position: "" }));
                  if (id === "__none__") setPrimary_position("");
                  else {
                    const p = positions.find((x) => x.id === id);
                    if (p) setPrimary_position(p.position_code);
                  }
                }}
              >
                <SelectTrigger className={errors.primary_position ? "border-red-500" : undefined}>
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
              {errors.primary_position && <p className="text-sm text-red-600">{errors.primary_position}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-800">2. Oceny i analiza</h2>
          <div>
            <StrengthsWeaknessesTagField
              label="Mocne strony"
              value={strengths}
              onChange={setStrengths}
              dictionaryOptions={(strengthsOptions as { id: string; name_pl: string }[]).map((r) => ({ id: r.id, name_pl: String(r.name_pl) }))}
              variant="strengths"
            />
          </div>
          <div>
            <StrengthsWeaknessesTagField
              label="Słabe strony"
              value={weaknesses}
              onChange={setWeaknesses}
              dictionaryOptions={(weaknessesOptions as { id: string; name_pl: string }[]).map((r) => ({ id: r.id, name_pl: String(r.name_pl) }))}
              variant="weaknesses"
            />
          </div>
          <div>
            <Label>Potencjał obecny</Label>
            <div className="flex w-full gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPotential_now(v)}
                  className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition ${
                    potential_now === v ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Potencjał przyszły</Label>
            <div className="flex w-full gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPotential_future(v)}
                  className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition ${
                    potential_future === v ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Ocena ogólna (1–10) <span className="text-red-600">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setOverall_rating(v)}
                  className={`min-h-12 min-w-10 flex-1 rounded-lg border-2 text-base font-medium transition ${
                    overall_rating === v ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Ocena za występ (1–5) <span className="text-red-600">*</span></Label>
            <div className="flex w-full gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMatch_performance_rating(v)}
                  className={`min-h-12 flex-1 rounded-lg border-2 text-base font-medium transition ${
                    match_performance_rating === v ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Rekomendacja <span className="text-red-600">*</span></Label>
            <div className="flex gap-2">
              {(["positive", "to_observe", "negative"] as const).map((r) => (
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
          <div className="space-y-1">
            <Label>Podsumowanie (min. 10 znaków) <span className="text-red-600">*</span></Label>
            <Textarea
              rows={4}
              value={summary}
              onChange={(e) => { setSummary(e.target.value); setErrors((prev) => ({ ...prev, summary: "" })); }}
              placeholder="Opis występu, mocne i słabe strony..."
              className={errors.summary ? "border-red-500" : undefined}
            />
            {errors.summary && <p className="text-sm text-red-600">{errors.summary}</p>}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
          <Button type="submit">
            Zapisz i wróć
          </Button>
        </div>
      </form>
    </div>
  );
}
