import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

type Area = "AKADEMIA" | "SENIOR";
type Foot = Database["public"]["Enums"]["dominant_foot"];
type Source = Database["public"]["Enums"]["observation_source"];

type RawRow = Record<string, unknown>;

type CanonicalRow = {
  rowNo: number;
  firstName: string;
  lastName: string;
  birthYear: number;
  birthDate: string | null;
  clubName: string | null;
  regionName: string | null;
  scoutName: string | null;
  kadra: string | null;
  observationDate: string | null;
  rodzaj: string | null;
  positionRaw: string | null;
  dominantFoot: Foot | null;
  potentialNow: number | null;
  potentialFuture: number | null;
  notes: string | null;
  rawPayload: RawRow;
  parseErrors: string[];
};

type ImportReport = {
  runId: string;
  filePath: string;
  targetArea: Area;
  dryRun: boolean;
  startedAt: string;
  finishedAt?: string;
  rows: {
    total: number;
    parsedOk: number;
    parsedWithErrors: number;
    rejected: number;
  };
  entities: {
    clubsInserted: number;
    playersInserted: number;
    observationsInserted: number;
    observationsUpdated: number;
    scoutsMapped: number;
    scoutsPlaceholder: number;
  };
  mapping: {
    handledColumns: string[];
    unmappedColumns: string[];
  };
  errors: Array<{ rowNo: number; stage: string; message: string }>;
};

type UsersRow = Database["public"]["Tables"]["users"]["Row"];
type ClubsRow = Database["public"]["Tables"]["clubs"]["Row"];
type RegionsRow = Database["public"]["Tables"]["regions"]["Row"];
type PlayersInsert = Database["public"]["Tables"]["players"]["Insert"];
type ObservationsInsert = Database["public"]["Tables"]["observations"]["Insert"];
type ObservationsUpdate = Database["public"]["Tables"]["observations"]["Update"];

const DEFAULT_FILE =
  "C:\\Projekty\\CursorAplications\\ScoutApp Materiały\\Dane KS Polonia\\Import akademia.xlsx";
const DEFAULT_AREA: Area = "AKADEMIA";
const DEFAULT_SOURCE: Source = "scouting";
const REPORTS_DIR = path.resolve(process.cwd(), "scripts", "reports");

function getArg(name: string): string | null {
  const direct = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (direct) return direct.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeHeader(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "");
}

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function parseBirthYear(value: unknown): number | null {
  const t = asString(value).replace(/[^0-9]/g, "");
  if (!t) return null;
  const year = Number.parseInt(t, 10);
  if (!Number.isFinite(year)) return null;
  if (year < 1980 || year > new Date().getFullYear()) return null;
  return year;
}

function parseDate(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (d?.y && d?.m && d?.d) {
      const month = String(d.m).padStart(2, "0");
      const day = String(d.d).padStart(2, "0");
      return `${d.y}-${month}-${day}`;
    }
  }
  const t = asString(value);
  if (!t || normalizeText(t) === "b.d.") return null;
  const dot = t.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dot) return `${dot[3]}-${dot[2]}-${dot[1]}`;
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Excel-like "7/4/25"
  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const m = String(slash[1]).padStart(2, "0");
    const d = String(slash[2]).padStart(2, "0");
    const yRaw = String(slash[3]);
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${m}-${d}`;
  }
  return null;
}

function parseFoot(value: unknown): Foot | null {
  const t = normalizeText(asString(value));
  if (!t) return null;
  if (t.includes("praw") || t === "r" || t.includes("right")) return "right";
  if (t.includes("lew") || t === "l" || t.includes("left")) return "left";
  if (t.includes("obie") || t.includes("both")) return "both";
  return null;
}

function parseScore(value: unknown): number | null {
  const t = asString(value).replace(",", ".");
  if (!t) return null;
  const n = Number.parseFloat(t.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 5) return null;
  return n;
}

function parsePositionRaw(value: unknown): string | null {
  const t = asString(value);
  return t || null;
}

function mapSourceFromRodzaj(rodzaj: string | null): Source {
  const t = normalizeText(rodzaj ?? "");
  if (!t) return DEFAULT_SOURCE;
  if (t.includes("wideo")) return "video_match";
  if (t.includes("na zywo")) return "live_match";
  return DEFAULT_SOURCE;
}

function nowIsoCompact() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function pickFirstDefined(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return undefined;
}

function buildCanonicalRows(rawRows: RawRow[]): { rows: CanonicalRow[]; allHeaders: string[] } {
  const headerSet = new Set<string>();
  const rows: CanonicalRow[] = [];

  for (let i = 0; i < rawRows.length; i += 1) {
    const raw = rawRows[i]!;
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      headerSet.add(k);
      normalized[normalizeHeader(k)] = v;
    }

    const parseErrors: string[] = [];
    const firstName = asString(pickFirstDefined(normalized, ["imie", "firstname"]));
    const lastName = asString(pickFirstDefined(normalized, ["nazwisko", "lastname"]));
    const birthYear = parseBirthYear(pickFirstDefined(normalized, ["rocznik", "rokurodzenia"]));
    const birthDate = parseDate(normalized.dob);
    const clubName = asString(normalized.klub) || null;
    const regionName = asString(pickFirstDefined(normalized, ["kadra", "region", "wojewodztwo"])) || null;
    const scoutName = asString(normalized.scout) || null;
    const kadra = asString(normalized.kadra) || null;
    const observationDate = parseDate(pickFirstDefined(normalized, ["dataobserwacji", "dataobserwacjimeczu"]));
    const rodzaj = asString(normalized.rodzaj) || null;
    const positionRaw = parsePositionRaw(normalized.pozycja);
    const dominantFoot = parseFoot(pickFirstDefined(normalized, ["noga", "nogadominujaca"]));
    const potentialNow = parseScore(pickFirstDefined(normalized, ["performance", "performance"]));
    const potentialFuture = parseScore(
      pickFirstDefined(normalized, ["potencjalprzyszly", "potencjaprzyszy"])
    );
    const notes = asString(pickFirstDefined(normalized, ["opis", "uwagi", "komentarz"])) || null;

    if (!firstName) parseErrors.push("missing_first_name");
    if (!lastName) parseErrors.push("missing_last_name");
    if (!birthYear) parseErrors.push("invalid_birth_year");

    rows.push({
      rowNo: i + 2,
      firstName,
      lastName,
      birthYear: birthYear ?? 0,
      birthDate,
      clubName,
      regionName,
      scoutName,
      kadra,
      observationDate,
      rodzaj,
      positionRaw,
      dominantFoot,
      potentialNow,
      potentialFuture,
      notes,
      rawPayload: raw,
      parseErrors,
    });
  }

  return { rows, allHeaders: Array.from(headerSet) };
}

function pickAgeCategoryId(
  categories: Array<{ id: string; min_birth_year: number | null; max_birth_year: number | null; area?: string | null }>,
  birthYear: number,
  targetArea: Area
): string | null {
  const scoped = categories.filter((c) => {
    const area = (c.area ?? "").toUpperCase();
    return area === targetArea || area === "ALL";
  });
  const byRange = scoped.find((c) => {
    if (c.min_birth_year == null || c.max_birth_year == null) return false;
    return birthYear >= c.min_birth_year && birthYear <= c.max_birth_year;
  });
  if (byRange) return byRange.id;
  return scoped[0]?.id ?? null;
}

function obsKey(input: {
  player_id: string;
  observation_date: string;
  created_by_name: string | null;
  source: Source;
  rank: string | null;
}) {
  return [
    input.player_id,
    input.observation_date,
    normalizeText(input.created_by_name ?? ""),
    input.source,
    normalizeText(input.rank ?? ""),
  ].join("|");
}

async function main() {
  const filePath = getArg("file") ?? DEFAULT_FILE;
  const targetArea = ((getArg("area") ?? DEFAULT_AREA).toUpperCase() as Area);
  const dryRun = hasFlag("dry-run");
  const placeholderScoutEmail = getArg("placeholder-scout-email") ?? process.env.PLACEHOLDER_SCOUT_EMAIL ?? "";
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  if (!["AKADEMIA", "SENIOR"].includes(targetArea)) throw new Error("Invalid --area. Allowed: AKADEMIA|SENIOR.");
  if (!placeholderScoutEmail) throw new Error("Missing --placeholder-scout-email or PLACEHOLDER_SCOUT_EMAIL.");

  const runId = crypto.randomUUID();
  const report: ImportReport = {
    runId,
    filePath,
    targetArea,
    dryRun,
    startedAt: new Date().toISOString(),
    rows: { total: 0, parsedOk: 0, parsedWithErrors: 0, rejected: 0 },
    entities: {
      clubsInserted: 0,
      playersInserted: 0,
      observationsInserted: 0,
      observationsUpdated: 0,
      scoutsMapped: 0,
      scoutsPlaceholder: 0,
    },
    mapping: { handledColumns: [], unmappedColumns: [] },
    errors: [],
  };

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const workbook = XLSX.readFile(filePath, { raw: false, cellDates: true, codepage: 1250 });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("XLSX has no sheets.");
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) throw new Error("Cannot read first sheet.");
  const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });

  const { rows, allHeaders } = buildCanonicalRows(rawRows);
  report.rows.total = rows.length;
  report.rows.parsedWithErrors = rows.filter((r) => r.parseErrors.length > 0).length;
  report.rows.parsedOk = rows.length - report.rows.parsedWithErrors;

  const handled = [
    "Nazwisko", "Imię", "Rocznik", "DOB", "Klub", "Scout", "Kadra",
    "Data obserwacji", "Rodzaj", "Pozycja", "Noga", "Performance", "Potencjał przyszły", "Opis",
  ];
  report.mapping.handledColumns = handled;
  report.mapping.unmappedColumns = allHeaders.filter((h) => !handled.some((x) => normalizeHeader(x) === normalizeHeader(h)));

  const validRows = rows.filter((r) => r.parseErrors.length === 0);
  report.rows.rejected = rows.length - validRows.length;

  const [{ data: usersData, error: usersErr }, { data: clubsData, error: clubsErr }, { data: regionsData, error: regionsErr }] =
    await Promise.all([
      supabase.from("users").select("id,email,full_name"),
      supabase.from("clubs").select("id,name,area,is_active"),
      supabase.from("regions").select("id,name"),
    ]);

  if (usersErr) throw usersErr;
  if (clubsErr) throw clubsErr;
  if (regionsErr) throw regionsErr;

  const users = (usersData ?? []) as UsersRow[];
  const clubs = (clubsData ?? []) as ClubsRow[];
  const regions = (regionsData ?? []) as RegionsRow[];

  const placeholderScout = users.find((u) => normalizeText(u.email) === normalizeText(placeholderScoutEmail));
  if (!placeholderScout) throw new Error(`Placeholder scout user not found by email: ${placeholderScoutEmail}`);

  const usersByName = new Map<string, UsersRow>();
  for (const u of users) {
    if (u.full_name) usersByName.set(normalizeText(u.full_name), u);
  }

  const clubsByName = new Map<string, ClubsRow>();
  for (const c of clubs) clubsByName.set(normalizeText(c.name), c);
  const regionsByName = new Map<string, RegionsRow>();
  for (const r of regions) regionsByName.set(normalizeText(r.name), r);

  const { data: categoriesData, error: categoriesErr } = await (supabase as any)
    .from("categories")
    .select("id,min_birth_year,max_birth_year,area")
    .order("created_at", { ascending: true });
  if (categoriesErr) throw categoriesErr;
  const categories = (categoriesData ?? []) as Array<{ id: string; min_birth_year: number | null; max_birth_year: number | null; area?: string | null }>;

  const newClubNames = Array.from(new Set(validRows.map((r) => r.clubName).filter((x): x is string => Boolean(x))))
    .filter((name) => !clubsByName.has(normalizeText(name)));

  if (!dryRun && newClubNames.length > 0) {
    const payload = newClubNames.map((name) => ({ name, is_active: true, area: targetArea }));
    const { error } = await (supabase as any).from("clubs").insert(payload);
    if (error) throw error;
    report.entities.clubsInserted = payload.length;
    const { data: refreshedClubs, error: refreshedErr } = await supabase.from("clubs").select("id,name,area,is_active");
    if (refreshedErr) throw refreshedErr;
    clubsByName.clear();
    for (const c of (refreshedClubs ?? []) as ClubsRow[]) clubsByName.set(normalizeText(c.name), c);
  } else {
    report.entities.clubsInserted = newClubNames.length;
  }

  const playerKeyToId = new Map<string, string>();
  const obsCandidates: Array<{
    rowNo: number;
    insert: ObservationsInsert;
  }> = [];

  for (const row of validRows) {
    const clubId = row.clubName ? clubsByName.get(normalizeText(row.clubName))?.id ?? null : null;
    const regionId = row.regionName ? regionsByName.get(normalizeText(row.regionName))?.id ?? null : null;
    const ageCategoryId = pickAgeCategoryId(categories, row.birthYear, targetArea);
    if (!ageCategoryId) {
      report.errors.push({ rowNo: row.rowNo, stage: "transform", message: "No category for target area" });
      continue;
    }

    const pKey = `${normalizeText(row.firstName)}|${normalizeText(row.lastName)}|${row.birthYear}|${clubId ?? ""}`;
    let playerId = playerKeyToId.get(pKey);

    if (!playerId) {
      const lookup = await supabase
        .from("players")
        .select("id")
        .eq("first_name", row.firstName)
        .eq("last_name", row.lastName)
        .eq("birth_year", row.birthYear)
        .eq("club_id", clubId)
        .limit(1)
        .maybeSingle();
      if (lookup.error) {
        report.errors.push({ rowNo: row.rowNo, stage: "lookup_player", message: lookup.error.message });
        continue;
      }
      if (lookup.data?.id) {
        playerId = lookup.data.id;
      } else if (dryRun) {
        playerId = `dryrun-${pKey}`;
        report.entities.playersInserted += 1;
      } else {
        const payload: PlayersInsert = {
          first_name: row.firstName,
          last_name: row.lastName,
          birth_year: row.birthYear,
          birth_date: row.birthDate,
          club_id: clubId,
          region_id: regionId,
          primary_position: row.positionRaw,
          dominant_foot: row.dominantFoot,
          pipeline_status: "unassigned",
        };
        const { data: inserted, error: insertErr } = await (supabase as any)
          .from("players")
          .insert({ ...payload, age_category_id: ageCategoryId, created_by: placeholderScout.id })
          .select("id")
          .single();
        if (insertErr) {
          report.errors.push({ rowNo: row.rowNo, stage: "insert_player", message: insertErr.message });
          continue;
        }
        playerId = inserted.id as string;
        report.entities.playersInserted += 1;
      }
      playerKeyToId.set(pKey, playerId);
    }

    const mappedScout = row.scoutName ? usersByName.get(normalizeText(row.scoutName)) : null;
    if (mappedScout) report.entities.scoutsMapped += 1;
    else report.entities.scoutsPlaceholder += 1;

    const observationDate = row.observationDate ?? new Date().toISOString().slice(0, 10);
    const source = mapSourceFromRodzaj(row.rodzaj);

    obsCandidates.push({
      rowNo: row.rowNo,
      insert: {
        player_id: playerId,
        scout_id: mappedScout?.id ?? placeholderScout.id,
        source,
        observation_date: observationDate,
        competition: row.kadra,
        rank: row.rodzaj,
        potential_now: row.potentialNow,
        potential_future: row.potentialFuture,
        notes: row.notes,
        summary: row.notes,
        created_by_name: row.scoutName,
        observation_category: "individual",
        form_type: "simplified",
        created_by: mappedScout?.id ?? placeholderScout.id,
      },
    });
  }

  // Preload potentially matching existing observations for involved players (chunked).
  const playerIds = Array.from(new Set(obsCandidates.map((c) => c.insert.player_id).filter(Boolean)));
  const existingMap = new Map<string, { id: string; row: any }>();
  const CHUNK = 80;
  for (let i = 0; i < playerIds.length; i += CHUNK) {
    const chunk = playerIds.slice(i, i + CHUNK);
    const { data, error } = await (supabase as any)
      .from("observations")
      .select("id,player_id,observation_date,created_by_name,source,rank,potential_now,potential_future,notes,summary")
      .in("player_id", chunk);
    if (error) throw error;
    for (const row of (data ?? []) as any[]) {
      const key = obsKey({
        player_id: String(row.player_id),
        observation_date: String(row.observation_date),
        created_by_name: (row.created_by_name as string | null) ?? null,
        source: row.source as Source,
        rank: (row.rank as string | null) ?? null,
      });
      // Keep first occurrence; duplicates should be handled manually if present.
      if (!existingMap.has(key)) existingMap.set(key, { id: String(row.id), row });
    }
  }

  const toInsert: ObservationsInsert[] = [];
  const toUpdate: Array<{ id: string; patch: ObservationsUpdate }> = [];

  for (const c of obsCandidates) {
    const ins = c.insert;
    const key = obsKey({
      player_id: ins.player_id,
      observation_date: String(ins.observation_date),
      created_by_name: ins.created_by_name ?? null,
      source: ins.source as Source,
      rank: (ins.rank as string | null) ?? null,
    });
    const existing = existingMap.get(key);
    if (!existing) {
      toInsert.push(ins);
      continue;
    }

    const er = existing.row as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    // Only fill missing values; never overwrite non-null.
    if (er.potential_future == null && ins.potential_future != null) patch.potential_future = ins.potential_future;
    if (er.potential_now == null && ins.potential_now != null) patch.potential_now = ins.potential_now;
    if (er.notes == null && ins.notes != null) patch.notes = ins.notes;
    if (er.summary == null && (ins.summary as any) != null) patch.summary = ins.summary as any;

    if (Object.keys(patch).length === 0) continue;
    patch.updated_at = new Date().toISOString();
    patch.updated_by = ins.created_by;
    patch.updated_by_name = ins.created_by_name ?? null;
    patch.updated_by_role = null;
    toUpdate.push({ id: existing.id, patch: patch as ObservationsUpdate });
  }

  if (!dryRun) {
    if (toInsert.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from("observations").insert(chunk);
        if (error) throw error;
      }
    }
    if (toUpdate.length > 0) {
      for (const u of toUpdate) {
        const { error } = await supabase.from("observations").update(u.patch).eq("id", u.id);
        if (error) {
          report.errors.push({ rowNo: 0, stage: "update_observation", message: `${u.id}: ${error.message}` });
        }
      }
    }
  }

  report.entities.observationsInserted = toInsert.length;
  report.entities.observationsUpdated = toUpdate.length;

  report.finishedAt = new Date().toISOString();
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `import-akademia-upsert-${nowIsoCompact()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`Import run finished. dryRun=${dryRun}`);
  console.log(`Report: ${reportPath}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});

