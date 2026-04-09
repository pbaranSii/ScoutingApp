import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

type Area = "AKADEMIA" | "SENIOR";
type Foot = Database["public"]["Enums"]["dominant_foot"];
type ObservationSource = Database["public"]["Enums"]["observation_source"];
type RecommendationType = Database["public"]["Enums"]["recommendation_type"];
type FormType = Database["public"]["Enums"]["form_type"];
type ObservationCategoryType = Database["public"]["Enums"]["observation_category_type"];

type RawPayload = Record<string, unknown>;

type ImportRecord = {
  _meta?: { idempotency_key?: string; document_type?: string; source_index?: string };
  player?: {
    first_name?: string;
    last_name?: string;
    birth_year?: number;
    birth_date?: string | null;
    nationality?: string | null;
    dominant_foot?: Foot | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    body_build?: string | null;
    contract_end_date?: string | null;
    club_name_raw?: string | null;
    primary_position?: string | null;
    secondary_positions?: string[] | null;
  };
  observation?: {
    scout_name_raw?: string | null;
    observation_date?: string | null;
    source?: ObservationSource | string | null;
    recommendation?: RecommendationType | string | null;
    potential_now?: number | null;
    potential_future?: number | null;
    notes?: string | null;
    summary?: string | null;
    mental_description?: string | null;
    observation_category?: ObservationCategoryType | string | null;
    form_type?: FormType | string | null;
    match_performance_rating?: number | null;
  };
  motor_evaluations?: {
    speed?: number;
    endurance?: number;
    jumping?: number;
    agility?: number;
    acceleration?: number;
    strength?: number;
    description?: string | null;
  } | null;
  raw_payload?: RawPayload | null;
  match_observation_raw?: unknown | null;
};

type UsersRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "email" | "full_name">;
type ClubsRow = Pick<Database["public"]["Tables"]["clubs"]["Row"], "id" | "name" | "area">;
type CategoriesRow = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name" | "min_birth_year" | "max_birth_year" | "area"
>;

type PlayersInsert = Database["public"]["Tables"]["players"]["Insert"] & { import_batch_id?: string | null };
type PlayersUpdate = Database["public"]["Tables"]["players"]["Update"];
type ObservationsInsert = Database["public"]["Tables"]["observations"]["Insert"] & {
  raw_payload?: unknown | null;
  import_batch_id?: string | null;
};
type MotorInsert = Database["public"]["Tables"]["motor_evaluations"]["Insert"];

type ImportReport = {
  batchId: string;
  inputFile: string;
  dryRun: boolean;
  targetArea: Area;
  startedAt: string;
  finishedAt?: string;
  totals: {
    records: number;
    valid: number;
    rejected: number;
  };
  entities: {
    clubsInserted: number;
    playersInserted: number;
    playersUpdated: number;
    observationsInserted: number;
    observationsSkippedExisting: number;
    observationsUpdatedExisting: number;
    motorInserted: number;
  };
  scouts: {
    unique: number;
    mapped: number;
    unmapped: number;
    perScout: Array<{ scout_name_raw: string; user_id: string; email: string; observations: number; uniquePlayers: number }>;
    unmappedNames: string[];
  };
  errors: Array<{ index: number; stage: string; message: string }>;
};

const DEFAULT_INPUT =
  "C:\\Projekty\\CursorAplications\\ScoutApp Materiały\\Dane KS Polonia\\Dane Senior\\output\\import_ready_patched.json";

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

function nowIsoCompact() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function asString(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(v.trim());
}

function parseRecommendation(v: unknown): RecommendationType | null {
  const t = asString(v);
  if (!t) return null;
  if (t === "positive" || t === "to_observe" || t === "negative") return t;
  return null;
}

function parseFoot(v: unknown): Foot | null {
  const t = asString(v);
  if (!t) return null;
  if (t === "left" || t === "right" || t === "both") return t;
  return null;
}

function parseFormType(v: unknown): FormType | null {
  const t = asString(v);
  if (!t) return null;
  if (t === "simplified" || t === "extended") return t;
  return null;
}

function parseObsCategory(v: unknown): ObservationCategoryType | null {
  const t = asString(v);
  if (!t) return null;
  if (t === "individual" || t === "match_player") return t;
  return null;
}

function parseSource(v: unknown): ObservationSource | null {
  const t = asString(v);
  if (!t) return null;
  // keep current enum values flexible (schema may contain more values)
  return t as ObservationSource;
}

function pickAgeCategoryId(
  categories: CategoriesRow[],
  birthYear: number,
  targetArea: Area
): string | null {
  const scoped = categories.filter((c) => {
    const area = String(c.area ?? "").toUpperCase();
    return area === targetArea || area === "ALL";
  });
  const byRange = scoped.find((c) => {
    if (c.min_birth_year == null || c.max_birth_year == null) return false;
    return birthYear >= c.min_birth_year && birthYear <= c.max_birth_year;
  });
  if (byRange) return byRange.id;

  const byNameSenior = scoped.find((c) => normalizeText(c.name ?? "").includes("senior"));
  if (byNameSenior) return byNameSenior.id;
  return scoped[0]?.id ?? null;
}

function playerNaturalKey(rec: ImportRecord): string | null {
  const p = rec.player;
  if (!p?.first_name || !p?.last_name || typeof p.birth_year !== "number") return null;
  const club = asString(p.club_name_raw);
  return `${normalizeText(p.first_name)}|${normalizeText(p.last_name)}|${p.birth_year}|${normalizeText(club)}`;
}

const PGRST204_COLUMN_REGEX = /Could not find the '([^']+)' column/;

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function insertWithPgrst204Retry<T extends Record<string, unknown>>(args: {
  supabase: ReturnType<typeof createClient<Database>>;
  table: keyof Database["public"]["Tables"] | string;
  payload: T;
  select: string;
}) {
  let currentPayload: Record<string, unknown> = { ...args.payload };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res = await (args.supabase as any).from(args.table).insert(currentPayload).select(args.select).single();

  while (res?.error?.code === "PGRST204") {
    const message = String(res.error?.message ?? "");
    const match = message.match(PGRST204_COLUMN_REGEX);
    if (!match) break;
    const column = match[1];
    if (!column || !(column in currentPayload)) break;
    // drop unsupported column and retry
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete currentPayload[column];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res = await (args.supabase as any).from(args.table).insert(currentPayload).select(args.select).single();
  }

  return res as { data: unknown; error: unknown };
}

async function main() {
  const inputFile = getArg("file") ?? DEFAULT_INPUT;
  const dryRun = hasFlag("dry-run");
  const targetArea = "SENIOR" as Area;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");

  const batchId = crypto.randomUUID();
  const report: ImportReport = {
    batchId,
    inputFile,
    dryRun,
    targetArea,
    startedAt: new Date().toISOString(),
    totals: { records: 0, valid: 0, rejected: 0 },
    entities: {
      clubsInserted: 0,
      playersInserted: 0,
      playersUpdated: 0,
      observationsInserted: 0,
      observationsSkippedExisting: 0,
      observationsUpdatedExisting: 0,
      motorInserted: 0,
    },
    scouts: { unique: 0, mapped: 0, unmapped: 0, perScout: [], unmappedNames: [] },
    errors: [],
  };

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const jsonText = await fs.readFile(inputFile, "utf-8");
  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Input JSON must be an array.");
  const records = parsed as ImportRecord[];
  report.totals.records = records.length;

  const [usersRes, clubsRes, categoriesRes] = await Promise.all([
    supabase.from("users").select("id,email,full_name"),
    (supabase as any).from("clubs").select("id,name,area"),
    (supabase as any).from("categories").select("id,name,min_birth_year,max_birth_year,area").order("created_at", { ascending: true }),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (clubsRes.error) throw clubsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const users = (usersRes.data ?? []) as UsersRow[];
  const clubs = (clubsRes.data ?? []) as ClubsRow[];
  const categories = (categoriesRes.data ?? []) as CategoriesRow[];

  const usersByName = new Map<string, UsersRow>();
  for (const u of users) if (u.full_name) usersByName.set(normalizeText(u.full_name), u);

  const clubsByName = new Map<string, ClubsRow>();
  for (const c of clubs) clubsByName.set(normalizeText(c.name ?? ""), c);

  // Preflight: scout mapping summary and reject invalid rows.
  const perScoutObs = new Map<string, number>();
  const perScoutPlayers = new Map<string, Set<string>>();
  const unmappedScoutNames = new Set<string>();

  const rejected: Array<{ index: number; reason: string; record: ImportRecord }> = [];
  const validRecords: Array<{ index: number; record: ImportRecord; scout: UsersRow; clubName: string | null }> = [];

  for (let i = 0; i < records.length; i += 1) {
    const rec = records[i]!;
    const scoutNameRaw = asString(rec.observation?.scout_name_raw);
    const scout = scoutNameRaw ? usersByName.get(normalizeText(scoutNameRaw)) ?? null : null;
    if (!scout) {
      if (scoutNameRaw) unmappedScoutNames.add(scoutNameRaw);
      rejected.push({ index: i, reason: "unmapped_scout_name_raw", record: rec });
      continue;
    }

    const pKey = playerNaturalKey(rec);
    if (!pKey) {
      rejected.push({ index: i, reason: "missing_player_identity_fields", record: rec });
      continue;
    }

    const obsDate = rec.observation?.observation_date;
    if (obsDate != null && !isIsoDate(obsDate)) {
      rejected.push({ index: i, reason: "invalid_observation_date", record: rec });
      continue;
    }

    const clubName = asString(rec.player?.club_name_raw) || null;

    perScoutObs.set(scoutNameRaw, (perScoutObs.get(scoutNameRaw) ?? 0) + 1);
    if (!perScoutPlayers.has(scoutNameRaw)) perScoutPlayers.set(scoutNameRaw, new Set());
    perScoutPlayers.get(scoutNameRaw)!.add(pKey);

    validRecords.push({ index: i, record: rec, scout, clubName });
  }

  report.totals.valid = validRecords.length;
  report.totals.rejected = rejected.length;

  report.scouts.unique = new Set(validRecords.map((v) => asString(v.record.observation?.scout_name_raw))).size;
  report.scouts.unmappedNames = Array.from(unmappedScoutNames).sort((a, b) => a.localeCompare(b, "pl"));
  report.scouts.unmapped = report.scouts.unmappedNames.length;
  report.scouts.mapped = report.scouts.unique;

  const perScout = Array.from(perScoutObs.entries()).map(([name, count]) => {
    const u = usersByName.get(normalizeText(name))!;
    return {
      scout_name_raw: name,
      user_id: u.id,
      email: u.email ?? "",
      observations: count,
      uniquePlayers: perScoutPlayers.get(name)?.size ?? 0,
    };
  });
  report.scouts.perScout = perScout.sort((a, b) => b.observations - a.observations);

  if (unmappedScoutNames.size > 0) {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    const unmappedPath = path.join(REPORTS_DIR, `import-senior-unmapped-scouts-${nowIsoCompact()}.json`);
    await fs.writeFile(unmappedPath, JSON.stringify(Array.from(unmappedScoutNames), null, 2), "utf-8");
    console.error(`Unmapped scouts detected. File: ${unmappedPath}`);
    throw new Error("Unmapped scouts detected. Run preflight and fix user names before importing.");
  }

  // Insert missing clubs (area = SENIOR)
  const newClubNames = Array.from(
    new Set(validRecords.map((v) => v.clubName).filter((x): x is string => Boolean(x)))
  ).filter((name) => !clubsByName.has(normalizeText(name)));

  if (!dryRun && newClubNames.length > 0) {
    const payload = newClubNames.map((name) => ({ name, is_active: true, area: targetArea }));
    const { error } = await (supabase as any).from("clubs").insert(payload);
    if (error) throw error;
    report.entities.clubsInserted = payload.length;
    const refreshed = await (supabase as any).from("clubs").select("id,name,area");
    if (refreshed.error) throw refreshed.error;
    clubsByName.clear();
    for (const c of (refreshed.data ?? []) as ClubsRow[]) clubsByName.set(normalizeText(c.name ?? ""), c);
  } else {
    report.entities.clubsInserted = newClubNames.length;
  }

  const unimported: Array<{ index: number; stage: string; reason: string; record: ImportRecord }> = [];
  const playerKeyToId = new Map<string, string>();

  for (const { index, record, scout } of validRecords) {
    try {
      const p = record.player ?? {};
      const o = record.observation ?? {};

      const naturalKey = playerNaturalKey(record);
      if (!naturalKey) {
        unimported.push({ index, stage: "transform", reason: "missing_player_identity_fields", record });
        continue;
      }

      const clubName = asString(p.club_name_raw) || null;
      const clubId = clubName ? clubsByName.get(normalizeText(clubName))?.id ?? null : null;

      const birthYear = typeof p.birth_year === "number" ? p.birth_year : null;
      if (!birthYear) {
        unimported.push({ index, stage: "transform", reason: "invalid_birth_year", record });
        continue;
      }

      const ageCategoryId = pickAgeCategoryId(categories, birthYear, targetArea);
      if (!ageCategoryId) {
        unimported.push({ index, stage: "transform", reason: "no_category_for_senior_area", record });
        continue;
      }

      let playerId = playerKeyToId.get(naturalKey) ?? null;

      if (!playerId) {
        const lookup = await (supabase as any)
          .from("players")
          .select("id")
          .eq("first_name", p.first_name ?? "")
          .eq("last_name", p.last_name ?? "")
          .eq("birth_year", birthYear)
          .eq("club_id", clubId)
          .limit(1)
          .maybeSingle();
        if (lookup.error) {
          unimported.push({ index, stage: "lookup_player", reason: lookup.error.message, record });
          continue;
        }

        if (lookup.data?.id) {
          playerId = lookup.data.id as string;

          const update: PlayersUpdate = {
            birth_date: (p.birth_date && isIsoDate(p.birth_date) ? p.birth_date : null) ?? undefined,
            nationality: (asString(p.nationality) || null) ?? undefined,
            dominant_foot: parseFoot(p.dominant_foot) ?? undefined,
            height_cm: typeof p.height_cm === "number" ? p.height_cm : undefined,
            weight_kg: typeof p.weight_kg === "number" ? p.weight_kg : undefined,
            body_build: (asString(p.body_build) || null) ?? undefined,
            contract_end_date: p.contract_end_date && isIsoDate(p.contract_end_date) ? p.contract_end_date : undefined,
            primary_position: (asString(p.primary_position) || null) ?? undefined,
            secondary_positions: Array.isArray(p.secondary_positions) ? p.secondary_positions : undefined,
            club_id: clubId ?? undefined,
            age_category_id: ageCategoryId,
          };

          if (!dryRun) {
            const { error } = await (supabase as any).from("players").update(update).eq("id", playerId);
            if (error) throw error;
          }
          report.entities.playersUpdated += 1;
        } else if (dryRun) {
          playerId = `dryrun-${naturalKey}`;
          report.entities.playersInserted += 1;
        } else {
          const insert: PlayersInsert = {
            first_name: p.first_name ?? "",
            last_name: p.last_name ?? "",
            birth_year: birthYear,
            birth_date: p.birth_date && isIsoDate(p.birth_date) ? p.birth_date : null,
            nationality: asString(p.nationality) || null,
            dominant_foot: parseFoot(p.dominant_foot),
            height_cm: typeof p.height_cm === "number" ? p.height_cm : null,
            weight_kg: typeof p.weight_kg === "number" ? p.weight_kg : null,
            body_build: asString(p.body_build) || null,
            contract_end_date: p.contract_end_date && isIsoDate(p.contract_end_date) ? p.contract_end_date : null,
            primary_position: asString(p.primary_position) || null,
            secondary_positions: Array.isArray(p.secondary_positions) ? p.secondary_positions : null,
            club_id: clubId,
            age_category_id: ageCategoryId,
            created_by: scout.id,
            import_batch_id: batchId,
          };
          const inserted = await insertWithPgrst204Retry({
            supabase,
            table: "players",
            payload: insert as unknown as Record<string, unknown>,
            select: "id",
          });
          if ((inserted as any).error) throw (inserted as any).error;
          playerId = (inserted as any).data.id as string;
          report.entities.playersInserted += 1;
        }

        playerKeyToId.set(naturalKey, playerId);
      }

      const observationDate = o.observation_date && isIsoDate(o.observation_date) ? o.observation_date : null;
      if (!observationDate) {
        unimported.push({ index, stage: "transform", reason: "missing_observation_date", record });
        continue;
      }

      const source = parseSource(o.source) ?? ("scouting" as ObservationSource);
      const exists = await (supabase as any)
        .from("observations")
        .select("id,raw_payload,import_batch_id")
        .eq("player_id", playerId)
        .eq("scout_id", scout.id)
        .eq("observation_date", observationDate)
        .eq("source", source)
        .limit(1)
        .maybeSingle();
      if (exists.error) throw exists.error;
      if (exists.data?.id) {
        report.entities.observationsSkippedExisting += 1;

        // If the observation already exists, backfill raw_payload/import_batch_id only when missing.
        const existingRaw = (exists.data as { raw_payload?: unknown | null }).raw_payload;
        const existingBatch = (exists.data as { import_batch_id?: string | null }).import_batch_id;
        const existingIsObject = existingRaw != null && typeof existingRaw === "object";
        const existingKeys =
          existingIsObject ? Object.keys(existingRaw as Record<string, unknown>).length : 0;
        const shouldBackfillRaw = existingRaw == null || (existingIsObject && existingKeys === 0);
        const shouldBackfillBatch = !existingBatch;

        if (!dryRun && (shouldBackfillRaw || shouldBackfillBatch)) {
          const rawPayload = {
            ...(record.raw_payload ?? {}),
            _meta: record._meta ?? null,
          };
          const update: Record<string, unknown> = {};
          if (shouldBackfillRaw) update.raw_payload = rawPayload;
          if (shouldBackfillBatch) update.import_batch_id = batchId;
          const { error: upErr } = await (supabase as any)
            .from("observations")
            .update(update)
            .eq("id", exists.data.id);
          if (upErr) throw upErr;
          report.entities.observationsUpdatedExisting += 1;
        } else if (dryRun && (shouldBackfillRaw || shouldBackfillBatch)) {
          report.entities.observationsUpdatedExisting += 1;
        }

        continue;
      }

      const rawPayload = {
        ...(record.raw_payload ?? {}),
        _meta: record._meta ?? null,
      };

      const obsInsert: ObservationsInsert = {
        player_id: playerId,
        scout_id: scout.id,
        observation_date: observationDate,
        source,
        recommendation: parseRecommendation(o.recommendation),
        potential_now: typeof o.potential_now === "number" ? o.potential_now : null,
        potential_future: typeof o.potential_future === "number" ? o.potential_future : null,
        notes: asString(o.notes) || null,
        summary: asString(o.summary) || (asString(o.notes) || null),
        mental_description: asString(o.mental_description) || null,
        observation_category: parseObsCategory(o.observation_category) ?? "individual",
        form_type: parseFormType(o.form_type) ?? "simplified",
        match_performance_rating:
          typeof o.match_performance_rating === "number" ? o.match_performance_rating : null,
        created_by: scout.id,
        created_by_name: asString(o.scout_name_raw) || null,
        raw_payload: rawPayload,
        import_batch_id: batchId,
      };

      let observationId = `dryrun-observation-${index}`;
      if (!dryRun) {
        const insertedObs = await insertWithPgrst204Retry({
          supabase,
          table: "observations",
          payload: obsInsert as unknown as Record<string, unknown>,
          select: "id",
        });
        if ((insertedObs as any).error) throw (insertedObs as any).error;
        observationId = (insertedObs as any).data.id as string;
      }
      report.entities.observationsInserted += 1;

      if (!dryRun && record.motor_evaluations && typeof record.motor_evaluations === "object") {
        const me = record.motor_evaluations as NonNullable<ImportRecord["motor_evaluations"]>;
        const motorPayload: MotorInsert = {
          observation_id: observationId,
          speed: Number(me.speed),
          endurance: Number(me.endurance),
          jumping: Number(me.jumping),
          agility: Number(me.agility),
          acceleration: Number(me.acceleration),
          strength: Number(me.strength),
          description: me.description ?? null,
        };
        const { error } = await (supabase as any).from("motor_evaluations").insert(motorPayload);
        if (error) throw error;
        report.entities.motorInserted += 1;
      } else if (dryRun && record.motor_evaluations) {
        report.entities.motorInserted += 1;
      }
    } catch (e) {
      const message = errorToMessage(e);
      report.errors.push({ index, stage: "import", message });
      unimported.push({ index, stage: "import", reason: message, record });
    }
  }

  report.finishedAt = new Date().toISOString();
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `import-senior-${nowIsoCompact()}.json`);
  const unimportedPath = path.join(REPORTS_DIR, `import-senior-unimported-${nowIsoCompact()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");
  await fs.writeFile(unimportedPath, JSON.stringify({ batchId, unimported, rejected }, null, 2), "utf-8");

  console.log(`Import done. dryRun=${dryRun}`);
  console.log(`BatchId: ${batchId}`);
  console.log(`Report: ${reportPath}`);
  console.log(`Unimported: ${unimportedPath}`);
  console.log(
    `Players inserted=${report.entities.playersInserted}, updated=${report.entities.playersUpdated}, observations inserted=${report.entities.observationsInserted}, skippedExisting=${report.entities.observationsSkippedExisting}, motor inserted=${report.entities.motorInserted}`
  );
}

main().catch((err) => {
  console.error("Senior import failed:", err);
  process.exit(1);
});

