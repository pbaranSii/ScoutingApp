import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

type RawRow = Record<string, unknown>;

type ImportRow = {
  sheetName: string;
  source: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  clubName?: string;
  regionName?: string;
  primaryPosition?: string;
  dominantFoot?: "left" | "right" | "both";
  observationDate?: string;
  rank?: string;
  notes?: string;
};

const DEFAULT_FILE_PATH = path.resolve(
  process.cwd(),
  "..",
  "Materials",
  "Dane KS Polonia",
  "EWIDENCJA Zawodników Ciekawych 2025 2026 na dzien 31_12_25MATEUSZ SOKOŁOWSKI (version 1).xlsx"
);

const SHEET_SOURCE_MAP: Record<string, string> = {
  zapisani: "scouting",
  przetestowani: "scouting",
  odtrenerow: "trainer_report",
  odskautow: "scout_report",
  meczenazywo: "scouting",
  meczevideo: "scouting",
};

const REGION_SEED = [
  "mazowieckie",
  "kujawsko-pomorskie",
  "śląskie",
  "małopolskie",
  "wielkopolskie",
  "pomorskie",
  "dolnośląskie",
  "łódzkie",
  "lubelskie",
  "podlaskie",
  "warmińsko-mazurskie",
  "podkarpackie",
  "świętokrzyskie",
  "opolskie",
  "lubuskie",
  "zachodniopomorskie",
];

const CATEGORY_SEED = [
  { name: "U8", min_birth_year: 2018, max_birth_year: 2018 },
  { name: "U9", min_birth_year: 2017, max_birth_year: 2017 },
  { name: "U10", min_birth_year: 2016, max_birth_year: 2016 },
  { name: "U11", min_birth_year: 2015, max_birth_year: 2015 },
  { name: "U12", min_birth_year: 2014, max_birth_year: 2014 },
  { name: "U13", min_birth_year: 2013, max_birth_year: 2013 },
  { name: "U14", min_birth_year: 2012, max_birth_year: 2012 },
  { name: "U15", min_birth_year: 2011, max_birth_year: 2011 },
  { name: "U16", min_birth_year: 2010, max_birth_year: 2010 },
  { name: "U17", min_birth_year: 2009, max_birth_year: 2009 },
  { name: "U18", min_birth_year: 2008, max_birth_year: 2008 },
  { name: "U19", min_birth_year: 2007, max_birth_year: 2007 },
];

const POSITION_SEED = [
  { code: "1", name: "Bramkarz (GK)", category: "goalkeeper" },
  { code: "2", name: "Prawy obrońca (RB)", category: "defense" },
  { code: "3", name: "Lewy obrońca (LB)", category: "defense" },
  { code: "4", name: "Środkowy obrońca (CB)", category: "defense" },
  { code: "5", name: "Środkowy obrońca (CB)", category: "defense" },
  { code: "6", name: "Defensywny pomocnik (CDM)", category: "midfield" },
  { code: "8", name: "Środkowy pomocnik (CM)", category: "midfield" },
  { code: "10", name: "Ofensywny pomocnik (CAM)", category: "midfield" },
  { code: "7", name: "Prawy skrzydłowy (RW)", category: "attack" },
  { code: "11", name: "Lewy skrzydłowy (LW)", category: "attack" },
  { code: "9", name: "Napastnik (ST)", category: "attack" },
];

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeSheetName(value: string) {
  return normalizeHeader(value);
}

function getString(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function parseBirthYear(value: unknown) {
  const text = getString(value);
  const year = Number.parseInt(text.replace(/[^0-9]/g, ""), 10);
  if (Number.isNaN(year)) return null;
  return year;
}

function parseFoot(value: unknown): "left" | "right" | "both" | undefined {
  const text = getString(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!text) return undefined;
  if (text.includes("pra") || text === "r" || text.includes("right")) return "right";
  if (text.includes("lew") || text === "l" || text.includes("left")) return "left";
  if (text.includes("obie") || text.includes("obyd") || text.includes("both")) return "both";
  return undefined;
}

function normalizePosition(value: unknown): string | undefined {
  const text = getString(value);
  if (!text) return undefined;

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const codeMatch = normalized.match(/\b(1|2|3|4|5|6|7|8|9|10|11)\b/);
  if (codeMatch) return codeMatch[1];

  if (normalized.includes("gk") || normalized.includes("bramkarz")) return "1";
  if (normalized.includes("rb") || normalized.includes("prawy obronc")) return "2";
  if (normalized.includes("lb") || normalized.includes("lewy obronc")) return "3";
  if (normalized.includes("cb") || normalized.includes("srodkowy obronc")) return "4";
  if (normalized.includes("cdm") || normalized.includes("defensywny pomocnik")) return "6";
  if (normalized.includes("cm") || normalized.includes("srodkowy pomocnik")) return "8";
  if (normalized.includes("cam") || normalized.includes("ofensywny pomocnik")) return "10";
  if (normalized.includes("rw") || normalized.includes("prawy skrzydlowy")) return "7";
  if (normalized.includes("lw") || normalized.includes("lewy skrzydlowy")) return "11";
  if (normalized.includes("st") || normalized.includes("napastnik")) return "9";

  const compact = normalized.replace(/\s+/g, "");
  const compactMatch = compact.match(/^(1|2|3|4|5|6|7|8|9|10|11)$/);
  if (compactMatch) return compactMatch[1];

  const slashMatch = compact.match(/^(1|2|3|4|5|6|7|8|9|10|11)\/(1|2|3|4|5|6|7|8|9|10|11)$/);
  if (slashMatch) return `${slashMatch[1]}/${slashMatch[2]}`;

  return text.length <= 10 ? text : undefined;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return formatDate(new Date(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  const text = getString(value);
  if (!text) return undefined;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) return formatDate(date);
  }

  const dotMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) {
    const date = new Date(`${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) return formatDate(date);
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return formatDate(parsed);
  return undefined;
}

function buildNormalizedRow(row: RawRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  );
}

function extractValue(normalizedRow: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (key in normalizedRow) return normalizedRow[key];
  }
  return undefined;
}

function mapSheetToSource(sheetName: string) {
  const normalized = normalizeSheetName(sheetName);
  return SHEET_SOURCE_MAP[normalized] ?? "scouting";
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function ensureReferenceData(supabase: ReturnType<typeof createClient>) {
  const { data: existingRegions, error: regionError } = await supabase
    .from("regions")
    .select("id, name");
  if (regionError) throw regionError;
  const regionMap = new Map(existingRegions?.map((row) => [normalizeName(row.name), row.id]));
  const missingRegions = REGION_SEED.filter((name) => !regionMap.has(normalizeName(name)));
  if (missingRegions.length > 0) {
    const { error } = await supabase
      .from("regions")
      .insert(missingRegions.map((name) => ({ name, is_active: true })));
    if (error) throw error;
  }

  const { data: existingCategories, error: categoryError } = await supabase
    .from("categories")
    .select("id, name");
  if (categoryError) throw categoryError;
  const categoryMap = new Map(existingCategories?.map((row) => [row.name, row.id]));
  const missingCategories = CATEGORY_SEED.filter((row) => !categoryMap.has(row.name));
  if (missingCategories.length > 0) {
    const { error } = await supabase.from("categories").insert(missingCategories);
    if (error) throw error;
  }

  const { data: existingPositions, error: positionError } = await supabase
    .from("positions")
    .select("id, code");
  if (positionError) throw positionError;
  const positionMap = new Map(existingPositions?.map((row) => [row.code, row.id]));
  const missingPositions = POSITION_SEED.filter((row) => !positionMap.has(row.code));
  if (missingPositions.length > 0) {
    const { error } = await supabase.from("positions").insert(missingPositions);
    if (error) throw error;
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const filePath = process.env.EXCEL_PATH ?? DEFAULT_FILE_PATH;
  console.log(`Using Excel file: ${filePath}`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  await ensureReferenceData(supabase);

  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const importRows: ImportRow[] = [];
  let skippedRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
      defval: "",
      raw: false,
    });

    const source = mapSheetToSource(sheetName);
    for (const rawRow of rawRows) {
      const normalizedRow = buildNormalizedRow(rawRow);
      const lastName = getString(extractValue(normalizedRow, ["Nazwisko", "Nazw", "Lastname"]));
      const firstName = getString(extractValue(normalizedRow, ["Imię", "Imie", "Firstname"]));
      const birthYear = parseBirthYear(extractValue(normalizedRow, ["Rocznik", "Rok urodzenia"]));

      if (!lastName || !firstName || !birthYear) {
        skippedRows += 1;
        continue;
      }

      const clubName = getString(extractValue(normalizedRow, ["Klub"]));
      const regionName = getString(extractValue(normalizedRow, ["Kadra", "Region", "Województwo"]));
      const primaryPositionRaw = extractValue(normalizedRow, ["Pozycja"]);
      const footRaw = extractValue(normalizedRow, ["Noga", "Noga dominujaca"]);
      const observationDateRaw = extractValue(normalizedRow, ["Data obserwacji", "Data obserwacji meczu"]);
      const rankRaw = getString(extractValue(normalizedRow, ["Ranga"]));
      const notes = getString(extractValue(normalizedRow, ["Opis", "Uwagi", "Komentarz"]));

      importRows.push({
        sheetName,
        source,
        firstName,
        lastName,
        birthYear,
        clubName: clubName || undefined,
        regionName: regionName || undefined,
        primaryPosition: normalizePosition(primaryPositionRaw),
        dominantFoot: parseFoot(footRaw),
        observationDate: parseDateValue(observationDateRaw),
        rank: rankRaw ? rankRaw.trim().charAt(0).toUpperCase() : undefined,
        notes: notes || undefined,
      });
    }
  }

  console.log(`Loaded ${importRows.length} rows. Skipped ${skippedRows} rows.`);

  const scoutEmail = "mateusz.sokolowski@example.com";
  const scoutName = "Mateusz Sokołowski";
  const { data: existingScout, error: scoutLookupError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", scoutEmail)
    .limit(1)
    .maybeSingle();
  if (scoutLookupError) throw scoutLookupError;

  let scoutId = existingScout?.id;
  if (!scoutId) {
    const { data: newScout, error: scoutCreateError } = await supabase
      .from("users")
      .insert({
        email: scoutEmail,
        full_name: scoutName,
        role: "user",
        is_active: true,
      })
      .select("id")
      .single();
    if (scoutCreateError) throw scoutCreateError;
    scoutId = newScout.id;
  }

  const { data: existingRegions, error: regionError } = await supabase
    .from("regions")
    .select("id, name");
  if (regionError) throw regionError;
  const regionMap = new Map(existingRegions?.map((row) => [normalizeName(row.name), row.id]));

  const { data: existingClubs, error: clubError } = await supabase
    .from("clubs")
    .select("id, name");
  if (clubError) throw clubError;
  const clubMap = new Map(existingClubs?.map((row) => [normalizeName(row.name), row.id]));

  const clubNames = Array.from(
    new Set(importRows.map((row) => row.clubName).filter(Boolean) as string[])
  );
  const missingClubs = clubNames.filter((name) => !clubMap.has(normalizeName(name)));
  for (const chunk of chunkArray(missingClubs, 200)) {
    const { error } = await supabase
      .from("clubs")
      .insert(chunk.map((name) => ({ name, is_active: true })));
    if (error) throw error;
  }
  if (missingClubs.length > 0) {
    const { data: refreshedClubs, error: refreshError } = await supabase
      .from("clubs")
      .select("id, name");
    if (refreshError) throw refreshError;
    clubMap.clear();
    refreshedClubs?.forEach((row) => clubMap.set(normalizeName(row.name), row.id));
  }

  const playerCache = new Map<string, string>();
  const defaultObservationDate = formatDate(new Date());
  const observations: {
    player_id: string;
    scout_id: string;
    source: string;
    rank?: string | null;
    notes?: string | null;
    observation_date?: string;
  }[] = [];

  for (const row of importRows) {
    const clubId = row.clubName ? clubMap.get(normalizeName(row.clubName)) : null;
    const regionId = row.regionName ? regionMap.get(normalizeName(row.regionName)) : null;

    const playerKey = [
      normalizeName(row.firstName),
      normalizeName(row.lastName),
      row.birthYear,
      clubId ?? "",
    ].join("|");

    let playerId = playerCache.get(playerKey);
    if (!playerId) {
      let playerQuery = supabase
        .from("players")
        .select("id")
        .eq("first_name", row.firstName)
        .eq("last_name", row.lastName)
        .eq("birth_year", row.birthYear);

      if (clubId) {
        playerQuery = playerQuery.eq("club_id", clubId);
      }

      const { data: existingPlayer, error: playerLookupError } = await playerQuery
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (playerLookupError) throw playerLookupError;

      if (existingPlayer?.id) {
        playerId = existingPlayer.id;
      } else {
        const { data: newPlayer, error: playerInsertError } = await supabase
          .from("players")
          .insert({
            first_name: row.firstName,
            last_name: row.lastName,
            birth_year: row.birthYear,
            club_id: clubId ?? null,
            region_id: regionId ?? null,
            primary_position: row.primaryPosition ?? null,
            dominant_foot: row.dominantFoot ?? null,
            pipeline_status: "observed",
          })
          .select("id")
          .single();
        if (playerInsertError) throw playerInsertError;
        playerId = newPlayer.id;
      }

      playerCache.set(playerKey, playerId);
    }

    observations.push({
      player_id: playerId,
      scout_id: scoutId,
      source: row.source,
      rank: row.rank ?? null,
      notes: row.notes ?? null,
      observation_date: row.observationDate ?? defaultObservationDate,
    });
  }

  console.log(`Prepared ${observations.length} observations.`);
  let insertedObservations = 0;

  for (const chunk of chunkArray(observations, 500)) {
    const { error } = await supabase.from("observations").insert(chunk);
    if (error) throw error;
    insertedObservations += chunk.length;
    console.log(`Inserted ${insertedObservations}/${observations.length} observations...`);
  }

  const { count: playerCount, error: playerCountError } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });
  if (playerCountError) throw playerCountError;

  const { count: observationCount, error: observationCountError } = await supabase
    .from("observations")
    .select("*", { count: "exact", head: true });
  if (observationCountError) throw observationCountError;

  const { count: clubCount, error: clubCountError } = await supabase
    .from("clubs")
    .select("*", { count: "exact", head: true });
  if (clubCountError) throw clubCountError;

  const { count: regionCount, error: regionCountError } = await supabase
    .from("regions")
    .select("*", { count: "exact", head: true });
  if (regionCountError) throw regionCountError;

  console.log("Import completed.");
  console.log({
    players: playerCount,
    observations: observationCount,
    clubs: clubCount,
    regions: regionCount,
  });
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
