import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DictionaryConfig } from "../config";
import type { DictionaryRow } from "../api/dictionaries.api";
import { useRegions } from "../hooks/useDictionaries";

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
  const [decisionCategory, setDecisionCategory] = useState(
    config.table === "dict_recruitment_decisions" ? String(initial?.decision_category ?? "") : ""
  );
  const [city, setCity] = useState(config.table === "clubs" ? String(initial?.city ?? "") : "");
  const [regionId, setRegionId] = useState(
    config.table === "clubs" ? String(initial?.region_id ?? "") : ""
  );
  const [minBirthYear, setMinBirthYear] = useState<string>(
    config.table === "categories" ? String(initial?.min_birth_year ?? "") : ""
  );
  const [maxBirthYear, setMaxBirthYear] = useState<string>(
    config.table === "categories" ? String(initial?.max_birth_year ?? "") : ""
  );
  const [category, setCategory] = useState(
    config.table === "positions" ? String(initial?.category ?? "") : ""
  );

  const { data: regions = [] } = useRegions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    const nameTrim = name.trim();
    if (codeCol !== "id") {
      payload[codeCol] = code.trim() || slugFromName(nameTrim);
    }
    payload[nameCol] = nameTrim;
    if (nameEnCol) payload[nameEnCol] = nameEn.trim();
    if (orderCol && orderCol !== "id") payload[orderCol] = 0;
    if (config.table === "dict_player_sources") payload.description = description.trim() || null;
    if (config.table === "dict_recruitment_decisions")
      payload.decision_category = decisionCategory.trim() || null;
    if (config.table === "clubs") {
      payload.city = city.trim() || null;
      payload.region_id = regionId.trim() || null;
    }
    if (config.table === "categories") {
      payload.min_birth_year = minBirthYear !== "" ? Number(minBirthYear) : null;
      payload.max_birth_year = maxBirthYear !== "" ? Number(maxBirthYear) : null;
    }
    if (config.table === "positions") payload.category = category.trim() || null;
    await onSubmit(payload);
  };

  const showCode = codeCol !== "id";
  const showNameEn = Boolean(nameEnCol);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showCode && (
        <div>
          <Label htmlFor="code">Kod (opcjonalnie)</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="np. GK, prawa — zostaw puste, aby wygenerować z nazwy"
          />
        </div>
      )}
      <div>
        <Label htmlFor="name">{config.table === "positions" ? "Nazwa" : "Nazwa (PL)"}</Label>
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
      {config.table === "positions" && (
        <div>
          <Label htmlFor="category">Kategoria</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="np. Bramka, Obrona"
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
            <Label htmlFor="region_id">Województwo (opcjonalnie)</Label>
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
