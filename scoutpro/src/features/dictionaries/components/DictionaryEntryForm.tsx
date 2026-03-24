import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DictionaryConfig } from "../config";
import type { DictionaryRow } from "../api/dictionaries.api";
import { useLeagues, useRegions } from "../hooks/useDictionaries";

type DictionaryEntryFormProps = {
  config: DictionaryConfig;
  initial?: DictionaryRow | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function DictionaryEntryForm({
  config,
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: DictionaryEntryFormProps) {
  const codeCol = config.codeColumn;
  const nameCol = config.nameColumn;
  const nameEnCol = config.nameEnColumn ?? null;
  const orderCol = config.orderColumn;

  /** Generuje slug z nazwy (dla opcjonalnego kodu). */
  const slugFromName = (text: string) => {
    const pl: Record<string, string> = {
      ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
    };
    return text
      .trim()
      .toLowerCase()
      .replace(/[ąćęłńóśźż]/g, (c) => pl[c] ?? c)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "item";
  };

  const [code, setCode] = useState(String(initial?.[codeCol] ?? ""));
  const [name, setName] = useState(String(initial?.[nameCol] ?? ""));
  const [nameEn, setNameEn] = useState(nameEnCol ? String(initial?.[nameEnCol] ?? "") : "");
  const [description, setDescription] = useState(
    config.table === "dict_player_sources" ? String(initial?.description ?? "") : ""
  );
  const [isDefaultSource, setIsDefaultSource] = useState(
    config.table === "dict_player_sources" ? Boolean(initial?.is_default) : false
  );
  const [decisionCategory, setDecisionCategory] = useState(
    config.table === "dict_recruitment_decisions" ? String(initial?.decision_category ?? "") : ""
  );
  const [city, setCity] = useState(config.table === "clubs" ? String(initial?.city ?? "") : "");
  const [clubCountry, setClubCountry] = useState(
    config.table === "clubs" ? String(initial?.country_pl ?? "") : ""
  );
  const [regionId, setRegionId] = useState(
    config.table === "clubs" ? String(initial?.region_id ?? "") : ""
  );
  const [clubLeagueId, setClubLeagueId] = useState(
    config.table === "clubs" ? String(initial?.league_id ?? "") : ""
  );
  const [clubArea, setClubArea] = useState(
    config.table === "clubs" ? String(initial?.area ?? "AKADEMIA") : "AKADEMIA"
  );
  const [leagueCode, setLeagueCode] = useState(config.table === "leagues" ? String(initial?.code ?? "") : "");
  const [leagueCountryPl, setLeagueCountryPl] = useState(
    config.table === "leagues" ? String(initial?.country_pl ?? "") : ""
  );
  const [leagueCountryIso, setLeagueCountryIso] = useState(
    config.table === "leagues" ? String(initial?.country_iso ?? "") : ""
  );
  const [leagueCountryEn, setLeagueCountryEn] = useState(
    config.table === "leagues" ? String(initial?.country_en ?? "") : ""
  );
  const [leagueLevel, setLeagueLevel] = useState(config.table === "leagues" ? String(initial?.level ?? "") : "");
  const [leagueOfficialName, setLeagueOfficialName] = useState(
    config.table === "leagues" ? String(initial?.official_name ?? "") : ""
  );
  const [leagueNamePl, setLeagueNamePl] = useState(config.table === "leagues" ? String(initial?.name_pl ?? "") : "");
  const [leagueDisplayName, setLeagueDisplayName] = useState(
    config.table === "leagues" ? String(initial?.display_name ?? "") : ""
  );
  const [leagueGroupName, setLeagueGroupName] = useState(
    config.table === "leagues" ? String(initial?.group_name ?? "") : ""
  );
  const [leagueObserved, setLeagueObserved] = useState(
    config.table === "leagues" ? Boolean(initial?.is_observed) : false
  );
  const [leagueArea, setLeagueArea] = useState(
    config.table === "leagues" ? String(initial?.area ?? "ALL") : "ALL"
  );
  const [leagueNotes, setLeagueNotes] = useState(config.table === "leagues" ? String(initial?.notes ?? "") : "");
  const [minBirthYear, setMinBirthYear] = useState<string>(
    config.table === "categories" ? String(initial?.min_birth_year ?? "") : ""
  );
  const [maxBirthYear, setMaxBirthYear] = useState<string>(
    config.table === "categories" ? String(initial?.max_birth_year ?? "") : ""
  );
  const [defaultFormType, setDefaultFormType] = useState<string>(
    config.table === "categories" ? String(initial?.default_form_type ?? "simplified") : "simplified"
  );
  const [ageUnder, setAgeUnder] = useState<string>(
    config.table === "categories" ? String(initial?.age_under ?? "") : ""
  );
  const [categoryArea, setCategoryArea] = useState<string>(
    config.table === "categories" ? String(initial?.area ?? "AKADEMIA") : "AKADEMIA"
  );

  const { data: regions = [] } = useRegions();
  const { data: leagues = [] } = useLeagues();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    const nameTrim = name.trim();
    if (codeCol !== "id") {
      payload[codeCol] = code.trim() || slugFromName(nameTrim);
    }
    payload[nameCol] = nameTrim;
    if (nameEnCol) payload[nameEnCol] = nameEn.trim();
    // Ustawiamy domyślny porządek tylko dla nowych rekordów i tylko gdy kolumna porządkowa
    // nie koliduje z kolumną nazwy/kodu (np. leagues ma orderColumn=name).
    if (
      !initial &&
      orderCol &&
      orderCol !== "id" &&
      orderCol !== nameCol &&
      orderCol !== codeCol
    ) {
      payload[orderCol] = 0;
    }
    if (config.table === "dict_player_sources") payload.description = description.trim() || null;
    if (config.table === "dict_player_sources") payload.is_default = isDefaultSource;
    if (config.table === "dict_recruitment_decisions")
      payload.decision_category = decisionCategory.trim() || null;
    if (config.table === "clubs") {
      payload.city = city.trim() || null;
      payload.country_pl = clubCountry.trim() || null;
      payload.region_id = regionId.trim() || null;
      payload.league_id = clubLeagueId.trim() || null;
      payload.area = clubArea === "SENIOR" ? "SENIOR" : clubArea === "ALL" ? "ALL" : "AKADEMIA";
    }
    if (config.table === "leagues") {
      payload.code = leagueCode.trim() || slugFromName(nameTrim);
      payload.country_pl = leagueCountryPl.trim() || null;
      payload.country_iso = leagueCountryIso.trim() || null;
      payload.country_en = leagueCountryEn.trim() || null;
      payload.level = leagueLevel.trim() !== "" ? Number(leagueLevel) : null;
      payload.official_name = leagueOfficialName.trim() || null;
      payload.name_pl = leagueNamePl.trim() || null;
      payload.display_name = leagueDisplayName.trim() || null;
      payload.group_name = leagueGroupName.trim() || null;
      payload.is_observed = leagueObserved;
      payload.area =
        leagueArea === "SENIOR" ? "SENIOR" : leagueArea === "AKADEMIA" ? "AKADEMIA" : "ALL";
      payload.notes = leagueNotes.trim() || null;
    }
    if (config.table === "categories") {
      payload.min_birth_year = minBirthYear !== "" ? Number(minBirthYear) : null;
      payload.max_birth_year = maxBirthYear !== "" ? Number(maxBirthYear) : null;
      payload.default_form_type = defaultFormType === "extended" ? "extended" : "simplified";
      payload.age_under = ageUnder !== "" ? Number(ageUnder) : null;
      payload.area = categoryArea === "SENIOR" ? "SENIOR" : "AKADEMIA";
    }
    await onSubmit(payload);
  };

  const showCode = codeCol !== "id";
  const showNameEn = Boolean(nameEnCol);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showCode && (
        <div>
          <Label htmlFor="code">Kod</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="np. GK, prawa — zostaw puste, aby wygenerować z nazwy"
          />
        </div>
      )}
      <div>
        <Label htmlFor="name">Nazwa (PL)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {showNameEn && (
        <div>
          <Label htmlFor="name_en">Nazwa (EN)</Label>
          <Input
            id="name_en"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </div>
      )}
      {config.table === "dict_player_sources" && (
        <div>
          <Label htmlFor="description">Opis</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
      )}
      {config.table === "dict_player_sources" && (
        <div>
          <Label htmlFor="is_default_source">Wartość domyślna</Label>
          <Select
            value={isDefaultSource ? "yes" : "no"}
            onValueChange={(v) => setIsDefaultSource(v === "yes")}
          >
            <SelectTrigger id="is_default_source">
              <SelectValue placeholder="Wybierz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Nie</SelectItem>
              <SelectItem value="yes">Tak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {config.table === "dict_recruitment_decisions" && (
        <div>
          <Label htmlFor="decision_category">Kategoria decyzji</Label>
          <Input
            id="decision_category"
            value={decisionCategory}
            onChange={(e) => setDecisionCategory(e.target.value)}
            placeholder="positive, negative, in_progress, monitoring"
          />
        </div>
      )}
      {config.table === "clubs" && (
        <>
          <div>
            <Label htmlFor="city">Miasto</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="club_country_pl">Kraj</Label>
            <Input id="club_country_pl" value={clubCountry} onChange={(e) => setClubCountry(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="region_id">Województwo</Label>
            <Select value={regionId || "_none"} onValueChange={(v) => setRegionId(v === "_none" ? "" : v)}>
              <SelectTrigger id="region_id">
                <SelectValue placeholder="Wybierz województwo" />
              </SelectTrigger>
              <SelectContent className="z-[90]">
                <SelectItem value="_none">— Brak —</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {String(r.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="league_id">Liga (opcjonalnie)</Label>
            <Select value={clubLeagueId || "_none"} onValueChange={(v) => setClubLeagueId(v === "_none" ? "" : v)}>
              <SelectTrigger id="league_id">
                <SelectValue placeholder="Wybierz ligę" />
              </SelectTrigger>
              <SelectContent className="z-[90]">
                <SelectItem value="_none">— Brak —</SelectItem>
                {leagues.map((l) => (
                  <SelectItem key={String(l.id)} value={String(l.id)}>
                    {String((l as Record<string, unknown>).display_name ?? l.name ?? l.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="club_area">Obszar dostępu</Label>
            <Select value={clubArea} onValueChange={setClubArea}>
              <SelectTrigger id="club_area">
                <SelectValue placeholder="Wybierz obszar" />
              </SelectTrigger>
              <SelectContent className="z-[90]">
                <SelectItem value="AKADEMIA">Akademia</SelectItem>
                <SelectItem value="SENIOR">Senior</SelectItem>
                <SelectItem value="ALL">Wszystkie obszary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {config.table === "leagues" && (
        <>
          <div>
            <Label htmlFor="league_code">Kod ligi</Label>
            <Input id="league_code" value={leagueCode} onChange={(e) => setLeagueCode(e.target.value)} placeholder="np. PL-SEN-1" />
          </div>
          <div>
            <Label htmlFor="league_display_name">Nazwa wyświetlana</Label>
            <Input id="league_display_name" value={leagueDisplayName} onChange={(e) => setLeagueDisplayName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="league_name_pl">Nazwa PL</Label>
            <Input id="league_name_pl" value={leagueNamePl} onChange={(e) => setLeagueNamePl(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="league_official_name">Nazwa oficjalna</Label>
            <Input id="league_official_name" value={leagueOfficialName} onChange={(e) => setLeagueOfficialName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="league_country_pl">Kraj (PL)</Label>
              <Input id="league_country_pl" value={leagueCountryPl} onChange={(e) => setLeagueCountryPl(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="league_country_iso">Kraj ISO</Label>
              <Input id="league_country_iso" value={leagueCountryIso} onChange={(e) => setLeagueCountryIso(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="league_country_en">Kraj (EN)</Label>
              <Input id="league_country_en" value={leagueCountryEn} onChange={(e) => setLeagueCountryEn(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="league_level">Poziom</Label>
              <Input id="league_level" type="number" min={1} value={leagueLevel} onChange={(e) => setLeagueLevel(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="league_group">Grupa</Label>
              <Input id="league_group" value={leagueGroupName} onChange={(e) => setLeagueGroupName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="league_area">Obszar</Label>
              <Select value={leagueArea} onValueChange={setLeagueArea}>
                <SelectTrigger id="league_area">
                  <SelectValue placeholder="Wybierz obszar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszystkie</SelectItem>
                  <SelectItem value="AKADEMIA">Akademia</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="league_observed">Obserwowana</Label>
            <Select value={leagueObserved ? "yes" : "no"} onValueChange={(v) => setLeagueObserved(v === "yes")}>
              <SelectTrigger id="league_observed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Tak</SelectItem>
                <SelectItem value="no">Nie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="league_notes">Uwagi</Label>
            <Textarea id="league_notes" rows={3} value={leagueNotes} onChange={(e) => setLeagueNotes(e.target.value)} />
          </div>
        </>
      )}
      {config.table === "categories" && (
        <>
          <div>
            <Label htmlFor="min_birth_year">Min. rocznik</Label>
            <Input
              id="min_birth_year"
              type="number"
              value={minBirthYear}
              onChange={(e) => setMinBirthYear(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="max_birth_year">Max. rocznik</Label>
            <Input
              id="max_birth_year"
              type="number"
              value={maxBirthYear}
              onChange={(e) => setMaxBirthYear(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="default_form_type">Domyślny typ formularza</Label>
            <Select
              value={defaultFormType}
              onValueChange={setDefaultFormType}
            >
              <SelectTrigger id="default_form_type">
                <SelectValue placeholder="Wybierz typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simplified">Uproszczony</SelectItem>
                <SelectItem value="extended">Rozszerzony</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="age_under">Wiek pod (U, opcjonalnie)</Label>
            <Input
              id="age_under"
              type="number"
              min={1}
              max={23}
              placeholder="np. 10 dla U10"
              value={ageUnder}
              onChange={(e) => setAgeUnder(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Gdy ustawione: rocznik odniesienia = bieżący rok − wartość (np. U10 w 2026 → rocznik 2016).
            </p>
          </div>
          <div>
            <Label htmlFor="category_area">Obszar</Label>
            <Select value={categoryArea} onValueChange={setCategoryArea}>
              <SelectTrigger id="category_area">
                <SelectValue placeholder="Wybierz obszar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AKADEMIA">Akademia</SelectItem>
                <SelectItem value="SENIOR">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie…" : initial ? "Zapisz" : "Dodaj"}
        </Button>
      </div>
    </form>
  );
}
