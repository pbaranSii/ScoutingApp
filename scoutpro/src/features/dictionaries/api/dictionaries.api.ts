import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { DictionaryConfig } from "../config";
import { toCsv } from "@/features/analytics/utils/export";
import { parseBoolean, parseCsv, parseNumber, rowsToObjects } from "../utils/csv";

export type DictionaryRow = Record<string, unknown> & { id: string };

type TableName = keyof Database["public"]["Tables"];

export type DictionaryImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

type CsvRow = Record<string, string>;

export async function fetchDictionaryCount(config: DictionaryConfig): Promise<{ total: number; active: number }> {
  const table = config.table as TableName;
  const activeCol = config.activeColumn;

  const { count: total, error: totalError } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (totalError) throw totalError;

  let active = total ?? 0;
  if (activeCol !== "id") {
    const { count: activeCount, error: activeError } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(activeCol, true);
    if (!activeError) active = activeCount ?? 0;
  }

  return { total: total ?? 0, active };
}

export async function fetchDictionaryEntries(
  config: DictionaryConfig,
  options?: { activeOnly?: boolean; search?: string }
): Promise<DictionaryRow[]> {
  const table = config.table;
  const nameCol = config.nameColumn;
  const activeCol = config.activeColumn;

  const tableName = table as TableName;
  const selectClause =
    table === "clubs"
      ? "*, region:regions(name), league:leagues(id,name,code,country_pl)"
      : "*";
  let q = supabase
    .from(tableName)
    .select(selectClause)
    .order(nameCol, { ascending: true, nullsFirst: false });

  if (activeCol !== "id" && options?.activeOnly === true) {
    q = q.eq(activeCol, true);
  }
  if (options?.search?.trim()) {
    q = q.ilike(nameCol, `%${options.search.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as DictionaryRow[];
  rows.sort((a, b) => {
    const na = String(a[nameCol] ?? "").toLowerCase();
    const nb = String(b[nameCol] ?? "").toLowerCase();
    return na.localeCompare(nb);
  });
  return rows;
}

export async function createDictionaryEntry(
  config: DictionaryConfig,
  payload: Record<string, unknown>
): Promise<DictionaryRow> {
  const table = config.table as TableName;
  if (table === "dict_player_sources" && payload.is_default === true) {
    const { error: resetError } = await supabase
      .from(table)
      .update({ is_default: false } as never)
      .eq("is_default", true);
    if (resetError) throw resetError;
  }
  const { data, error } = await supabase
    .from(table)
    .insert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return data as DictionaryRow;
}

export async function updateDictionaryEntry(
  config: DictionaryConfig,
  id: string,
  payload: Record<string, unknown>
): Promise<DictionaryRow> {
  const table = config.table;
  if (table === "dict_player_sources" && payload.is_default === true) {
    const { error: resetError } = await supabase
      .from(table as TableName)
      .update({ is_default: false } as never)
      .eq("is_default", true)
      .neq("id", id);
    if (resetError) throw resetError;
  }
  if (table.startsWith("dict_")) {
    payload.updated_at = new Date().toISOString();
  }
  const tableName = config.table as TableName;
  const { data, error } = await supabase
    .from(tableName)
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DictionaryRow;
}

export async function toggleDictionaryEntryActive(
  config: DictionaryConfig,
  id: string,
  isActive: boolean
): Promise<DictionaryRow> {
  const activeCol = config.activeColumn;
  if (activeCol === "id") throw new Error("Table has no is_active column");
  const payload: Record<string, unknown> = { [activeCol]: isActive };
  if (config.table.startsWith("dict_")) {
    payload.updated_at = new Date().toISOString();
  }
  return updateDictionaryEntry(config, id, payload);
}

export async function deleteDictionaryEntry(config: DictionaryConfig, id: string): Promise<void> {
  const table = config.table as TableName;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

function asString(v: unknown) {
  return v === null || v === undefined ? "" : String(v);
}

function safeGet(obj: DictionaryRow, key: string): string {
  return asString(obj[key as keyof DictionaryRow]).trim();
}

function getCsvValue(src: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = src[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function exportDictionaryEntriesToCsv(config: DictionaryConfig, entries: DictionaryRow[]): string {
  const id = config.id;
  const rows: Record<string, string | number | null | undefined>[] = [];

  if (id === "regions") {
    for (const e of entries) {
      rows.push({
        code: safeGet(e, "code"),
        name: safeGet(e, "name"),
        display_order: parseNumber(safeGet(e, "display_order")) ?? undefined,
        is_active: safeGet(e, "is_active"),
      });
    }
    return toCsv(rows);
  }

  if (id === "clubs") {
    for (const e of entries) {
      const regionName =
        asString((e as { region?: { name?: string } | null }).region?.name) ||
        asString((e as { regions?: { name?: string } | null }).regions?.name);
      const leagueName =
        asString((e as { league?: { name?: string } | null }).league?.name) ||
        asString((e as { leagues?: { name?: string } | null }).leagues?.name);
      const leagueCode =
        asString((e as { league?: { code?: string } | null }).league?.code) ||
        asString((e as { leagues?: { code?: string } | null }).leagues?.code);
      const leagueCountry =
        asString((e as { league?: { country_pl?: string } | null }).league?.country_pl) ||
        asString((e as { leagues?: { country_pl?: string } | null }).leagues?.country_pl);
      rows.push({
        name: safeGet(e, "name"),
        city: safeGet(e, "city"),
        region_code: safeGet(e, "region_code"),
        region_name: regionName,
        league_code: leagueCode,
        league_name: leagueName,
        country_pl: safeGet(e, "country_pl") || leagueCountry,
        area: safeGet(e, "area"),
        is_active: safeGet(e, "is_active"),
      });
    }
    return toCsv(rows);
  }

  if (id === "leagues") {
    for (const e of entries) {
      rows.push({
        liga_id: safeGet(e, "code"),
        kraj_pl: safeGet(e, "country_pl"),
        kraj_iso: safeGet(e, "country_iso"),
        kraj_en: safeGet(e, "country_en"),
        poziom: safeGet(e, "level"),
        nazwa_oficjalna: safeGet(e, "official_name"),
        nazwa_pl: safeGet(e, "name_pl"),
        nazwa_wyswietlana: safeGet(e, "display_name"),
        grupa: safeGet(e, "group_name"),
        obserwowana: safeGet(e, "is_observed"),
        kategoria: safeGet(e, "area"),
        uwagi: safeGet(e, "notes"),
        is_active: safeGet(e, "is_active"),
      });
    }
    return toCsv(rows);
  }

  if (id === "categories") {
    for (const e of entries) {
      rows.push({
        name: safeGet(e, "name"),
        area: safeGet(e, "area"),
        min_birth_year: safeGet(e, "min_birth_year"),
        max_birth_year: safeGet(e, "max_birth_year"),
        default_form_type: safeGet(e, "default_form_type"),
        age_under: safeGet(e, "age_under"),
        is_active: safeGet(e, "is_active"),
      });
    }
    return toCsv(rows);
  }

  if (id === "strengths" || id === "weaknesses") {
    for (const e of entries) {
      rows.push({
        code: safeGet(e, "code"),
        name_pl: safeGet(e, "name_pl"),
        name_en: safeGet(e, "name_en"),
        display_order: safeGet(e, "display_order"),
        is_active: safeGet(e, "is_active"),
      });
    }
    return toCsv(rows);
  }

  return toCsv(entries.map((e) => ({ id: e.id })));
}

export function exportDictionaryCsvTemplate(config: DictionaryConfig): string {
  const id = config.id;
  const headers =
    id === "regions"
      ? ["code", "name", "display_order", "is_active"]
      : id === "clubs"
        ? [
            "name",
            "city",
            "region_code",
            "region_name",
            "league_code",
            "league_name",
            "country_pl",
            "area",
            "is_active",
          ]
        : id === "leagues"
          ? [
              "liga_id",
              "kraj_pl",
              "kraj_iso",
              "kraj_en",
              "poziom",
              "nazwa_oficjalna",
              "nazwa_pl",
              "nazwa_wyswietlana",
              "grupa",
              "obserwowana",
              "kategoria",
              "uwagi",
              "is_active",
            ]
        : id === "categories"
          ? ["name", "area", "min_birth_year", "max_birth_year", "default_form_type", "age_under", "is_active"]
          : id === "strengths" || id === "weaknesses"
            ? ["code", "name_pl", "name_en", "display_order", "is_active"]
            : ["id"];
  return toCsv([Object.fromEntries(headers.map((h) => [h, ""]))]);
}

async function fetchAllRowsForUpsert(config: DictionaryConfig): Promise<DictionaryRow[]> {
  // We need full list to match keys. Dictionaries are small enough for this use-case.
  return fetchDictionaryEntries(config, { activeOnly: false });
}

export async function importDictionaryEntriesFromCsv(
  config: DictionaryConfig,
  csvText: string,
  options?: { applyIsActiveFromFile?: boolean }
): Promise<DictionaryImportResult> {
  const applyIsActiveFromFile = options?.applyIsActiveFromFile ?? true;

  const raw = parseCsv(csvText);
  const items = rowsToObjects(raw);
  const result: DictionaryImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  const existing = await fetchAllRowsForUpsert(config);

  const id = config.id;
  const activeCol = config.activeColumn;

  const normalizeKey = (s: string) => s.trim().toLowerCase();

  const existingByKey = new Map<string, DictionaryRow>();
  const makeKey = (row: CsvRow | DictionaryRow): string => {
    if (id === "regions") {
      const code = normalizeKey(asString((row as any).code));
      const name = normalizeKey(asString((row as any).name));
      return code || name;
    }
    if (id === "clubs") {
      const name = normalizeKey(asString((row as any).name));
      const city = normalizeKey(asString((row as any).city));
      return `${name}::${city}`;
    }
    if (id === "leagues") {
      const code = normalizeKey(asString((row as any).code ?? (row as any).liga_id));
      const name = normalizeKey(
        asString((row as any).name ?? (row as any).display_name ?? (row as any).nazwa_wyswietlana)
      );
      return code || name;
    }
    if (id === "categories") {
      return normalizeKey(asString((row as any).name));
    }
    if (id === "strengths" || id === "weaknesses") {
      return normalizeKey(asString((row as any).code));
    }
    return normalizeKey(asString((row as any).id));
  };

  for (const e of existing) {
    const k = makeKey(e);
    if (k) existingByKey.set(k, e);
  }

  // For clubs we may need regions mapping (by code or name)
  let regionsByCode = new Map<string, string>();
  let regionsByName = new Map<string, string>();
  let leaguesByCode = new Map<string, string>();
  let leaguesByName = new Map<string, string>();
  let leaguesByNameAndCountry = new Map<string, string>();
  if (id === "clubs") {
    const { data, error } = await supabase.from("regions").select("id,code,name");
    if (error) throw error;
    for (const r of (data ?? []) as any[]) {
      if (r.code) regionsByCode.set(normalizeKey(String(r.code)), String(r.id));
      if (r.name) regionsByName.set(normalizeKey(String(r.name)), String(r.id));
    }
    const { data: leaguesData, error: leaguesError } = await supabase
      .from("leagues")
      .select("id,code,name,display_name,country_pl,country_iso,country_en");
    if (leaguesError) throw leaguesError;
    for (const l of (leaguesData ?? []) as any[]) {
      if (l.code) leaguesByCode.set(normalizeKey(String(l.code)), String(l.id));
      if (l.name) leaguesByName.set(normalizeKey(String(l.name)), String(l.id));
      if (l.display_name) leaguesByName.set(normalizeKey(String(l.display_name)), String(l.id));
      const countries = [l.country_pl, l.country_iso, l.country_en]
        .filter(Boolean)
        .map((v) => normalizeKey(String(v)));
      const leagueNames = [l.name, l.display_name].filter(Boolean).map((v) => normalizeKey(String(v)));
      for (const c of countries) {
        for (const n of leagueNames) {
          leaguesByNameAndCountry.set(`${n}::${c}`, String(l.id));
        }
      }
    }
  }

  const setActive = (payload: Record<string, unknown>, src: CsvRow) => {
    if (!applyIsActiveFromFile) return;
    if (activeCol === "id") return;
    const b = parseBoolean(src[activeCol] ?? src.is_active);
    if (b !== undefined) payload[activeCol] = b;
  };

  for (let i = 0; i < items.length; i++) {
    const src = items[i];
    const rowNumber = i + 2; // + header
    try {
      const k = makeKey(src);
      if (!k) {
        result.skipped++;
        result.errors.push({ row: rowNumber, message: "Brak klucza dopasowania (wymagane pola są puste)." });
        continue;
      }

      const payload: Record<string, unknown> = {};

      if (id === "regions") {
        const code = src.code?.trim() || "";
        const name = src.name?.trim() || "";
        if (!code && !name) throw new Error("Wymagane: code lub name");
        if (code) payload.code = code;
        if (name) payload.name = name;
        const displayOrder = parseNumber(src.display_order);
        if (displayOrder !== undefined) payload.display_order = displayOrder;
        setActive(payload, src);
      } else if (id === "clubs") {
        const name = src.name?.trim() || "";
        if (!name) throw new Error("Wymagane: name");
        payload.name = name;
        if (src.city?.trim()) payload.city = src.city.trim();
        const importedCountry = getCsvValue(src, ["country_pl", "kraj", "country", "kraj_pl"]);
        if (importedCountry) payload.country_pl = importedCountry;
        setActive(payload, src);

        const regionCode = src.region_code?.trim();
        const regionName = src.region_name?.trim();
        const regionId =
          (regionCode ? regionsByCode.get(normalizeKey(regionCode)) : undefined) ??
          (regionName ? regionsByName.get(normalizeKey(regionName)) : undefined);
        if (regionId) payload.region_id = regionId;
        const leagueCode = src.league_code?.trim();
        const leagueName = src.league_name?.trim();
        const country = getCsvValue(src, ["country_pl", "kraj", "country", "kraj_pl"]).toLowerCase();
        const leagueByNameAndCountry =
          leagueName && country ? leaguesByNameAndCountry.get(`${normalizeKey(leagueName)}::${normalizeKey(country)}`) : undefined;
        const leagueId =
          leagueByNameAndCountry ??
          (leagueCode ? leaguesByCode.get(normalizeKey(leagueCode)) : undefined) ??
          (leagueName ? leaguesByName.get(normalizeKey(leagueName)) : undefined);
        payload.league_id = leagueId ?? null;
        const importedArea = getCsvValue(src, ["area", "obszar", "obszar_dostepu", "obszar dostępu"]);
        if (importedArea) {
          const area = importedArea.toUpperCase();
          payload.area = area === "SENIOR" ? "SENIOR" : area === "ALL" ? "ALL" : "AKADEMIA";
        }
      } else if (id === "leagues") {
        const code = (src.liga_id ?? src.code ?? "").trim();
        const displayName = (src.nazwa_wyswietlana ?? src.name ?? "").trim();
        if (!code && !displayName) throw new Error("Wymagane: liga_id lub nazwa_wyswietlana");

        payload.code = code || null;
        payload.name = displayName || code;
        payload.country_pl = (src.kraj_pl ?? "").trim() || null;
        payload.country_iso = (src.kraj_iso ?? "").trim() || null;
        payload.country_en = (src.kraj_en ?? "").trim() || null;
        const level = parseNumber(src.poziom ?? src.level);
        payload.level = level ?? null;
        payload.official_name = (src.nazwa_oficjalna ?? "").trim() || null;
        payload.name_pl = (src.nazwa_pl ?? "").trim() || null;
        payload.display_name = displayName || null;
        payload.group_name = (src.grupa ?? "").trim() || null;
        const isObserved = parseBoolean(src.obserwowana);
        payload.is_observed = isObserved ?? false;
        const categoryRaw = (src.kategoria ?? "").trim().toLowerCase();
        payload.area =
          categoryRaw === "seniorzy" || categoryRaw === "senior"
            ? "SENIOR"
            : categoryRaw === "akademia"
              ? "AKADEMIA"
              : "ALL";
        payload.notes = (src.uwagi ?? "").trim() || null;
        setActive(payload, src);
      } else if (id === "categories") {
        const name = src.name?.trim() || "";
        if (!name) throw new Error("Wymagane: name");
        payload.name = name;
        if (src.area?.trim()) {
          const area = src.area.trim().toUpperCase();
          payload.area = area === "SENIOR" ? "SENIOR" : "AKADEMIA";
        }
        const minBY = parseNumber(src.min_birth_year);
        const maxBY = parseNumber(src.max_birth_year);
        if (minBY !== undefined) payload.min_birth_year = minBY;
        if (maxBY !== undefined) payload.max_birth_year = maxBY;
        if (src.default_form_type?.trim()) payload.default_form_type = src.default_form_type.trim() === "extended" ? "extended" : "simplified";
        const au = parseNumber(src.age_under);
        if (au !== undefined) payload.age_under = au;
        setActive(payload, src);
      } else if (id === "strengths" || id === "weaknesses") {
        const code = src.code?.trim() || "";
        const namePl = src.name_pl?.trim() || "";
        if (!code) throw new Error("Wymagane: code");
        if (!namePl) throw new Error("Wymagane: name_pl");
        payload.code = code;
        payload.name_pl = namePl;
        if (src.name_en?.trim()) payload.name_en = src.name_en.trim();
        const displayOrder = parseNumber(src.display_order);
        if (displayOrder !== undefined) payload.display_order = displayOrder;
        setActive(payload, src);
      } else {
        throw new Error("Ten słownik nie jest obsługiwany przez import CSV.");
      }

      const match = existingByKey.get(k);
      if (match) {
        try {
          await updateDictionaryEntry(config, match.id, payload);
        } catch (e) {
          // In some environments `database.types.ts` is outdated vs DB schema.
          // Retry without optional columns if PostgREST rejects them.
          if (id === "categories") {
            const msg = e instanceof Error ? e.message : "";
            if (msg.includes("age_under") && "age_under" in payload) {
              const { age_under: _au, ...rest } = payload as any;
              await updateDictionaryEntry(config, match.id, rest);
            } else if (msg.includes("is_active") && activeCol !== "id" && activeCol in payload) {
              const { [activeCol]: _ia, ...rest } = payload as any;
              await updateDictionaryEntry(config, match.id, rest);
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
        result.updated++;
      } else {
        try {
          await createDictionaryEntry(config, payload);
        } catch (e) {
          if (id === "categories") {
            const msg = e instanceof Error ? e.message : "";
            if (msg.includes("age_under") && "age_under" in payload) {
              const { age_under: _au, ...rest } = payload as any;
              await createDictionaryEntry(config, rest);
            } else if (msg.includes("is_active") && activeCol !== "id" && activeCol in payload) {
              const { [activeCol]: _ia, ...rest } = payload as any;
              await createDictionaryEntry(config, rest);
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
        result.inserted++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd importu";
      result.errors.push({ row: rowNumber, message: msg });
    }
  }

  return result;
}
