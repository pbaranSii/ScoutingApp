import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

type RawPayload = Record<string, unknown>;

type ImportRecord = {
  _meta?: { idempotency_key?: string; document_type?: string; source_index?: string };
  player?: {
    first_name?: string;
    last_name?: string;
    birth_year?: number;
    birth_date?: string | null;
    nationality?: string | null;
    club_name_raw?: string | null;
    primary_position?: string | null;
  };
  observation?: {
    scout_name_raw?: string | null;
    observation_date?: string | null;
    source?: string | null;
    recommendation?: string | null;
    potential_now?: number | null;
    potential_future?: number | null;
    notes?: string | null;
    summary?: string | null;
    mental_description?: string | null;
    observation_category?: string | null;
    form_type?: string | null;
  };
  motor_evaluations?: unknown | null;
  raw_payload?: RawPayload | null;
};

type UsersRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "email" | "full_name">;

type ScoutSummary = {
  scoutNameRaw: string;
  matchedUserId: string | null;
  matchedEmail: string | null;
  observations: number;
  uniquePlayers: number;
};

type PreflightReport = {
  runId: string;
  inputFile: string;
  startedAt: string;
  finishedAt?: string;
  totals: {
    records: number;
    observations: number;
    uniquePlayers: number;
  };
  scouts: {
    totalUniqueScoutNames: number;
    mapped: number;
    unmapped: number;
    summaries: ScoutSummary[];
    unmappedNames: string[];
  };
  rejected: Array<{ index: number; reason: string; record: ImportRecord }>;
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

function safeScoutName(v: unknown): string {
  const t = typeof v === "string" ? v.trim() : "";
  return t;
}

function playerKey(rec: ImportRecord): string | null {
  const p = rec.player;
  if (!p?.first_name || !p?.last_name || typeof p.birth_year !== "number") return null;
  const club = (p.club_name_raw ?? "").trim();
  return `${normalizeText(p.first_name)}|${normalizeText(p.last_name)}|${p.birth_year}|${normalizeText(club)}`;
}

async function main() {
  const inputFile = getArg("file") ?? DEFAULT_INPUT;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const failOnUnmapped = !hasFlag("allow-unmapped-scouts");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const runId = crypto.randomUUID();
  const report: PreflightReport = {
    runId,
    inputFile,
    startedAt: new Date().toISOString(),
    totals: { records: 0, observations: 0, uniquePlayers: 0 },
    scouts: { totalUniqueScoutNames: 0, mapped: 0, unmapped: 0, summaries: [], unmappedNames: [] },
    rejected: [],
  };

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const jsonText = await fs.readFile(inputFile, "utf-8");
  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Input JSON must be an array.");

  const records = parsed as ImportRecord[];
  report.totals.records = records.length;

  const { data: usersData, error: usersErr } = await supabase.from("users").select("id,email,full_name");
  if (usersErr) throw usersErr;
  const users = (usersData ?? []) as UsersRow[];

  const usersByName = new Map<string, UsersRow>();
  for (const u of users) {
    if (u.full_name) usersByName.set(normalizeText(u.full_name), u);
  }

  const scoutNameSet = new Set<string>();
  const scoutToPlayers = new Map<string, Set<string>>();
  const scoutToObservations = new Map<string, number>();

  const globalPlayers = new Set<string>();

  for (let i = 0; i < records.length; i += 1) {
    const rec = records[i]!;
    const scoutName = safeScoutName(rec.observation?.scout_name_raw);
    const pKey = playerKey(rec);
    if (!scoutName) {
      report.rejected.push({ index: i, reason: "missing_scout_name_raw", record: rec });
      continue;
    }
    if (!pKey) {
      report.rejected.push({ index: i, reason: "missing_player_identity_fields", record: rec });
      continue;
    }

    scoutNameSet.add(scoutName);
    globalPlayers.add(pKey);

    if (!scoutToPlayers.has(scoutName)) scoutToPlayers.set(scoutName, new Set());
    scoutToPlayers.get(scoutName)!.add(pKey);
    scoutToObservations.set(scoutName, (scoutToObservations.get(scoutName) ?? 0) + 1);
  }

  report.totals.observations = Array.from(scoutToObservations.values()).reduce((a, b) => a + b, 0);
  report.totals.uniquePlayers = globalPlayers.size;

  const unmapped: string[] = [];
  const summaries: ScoutSummary[] = [];
  for (const scoutNameRaw of Array.from(scoutNameSet).sort((a, b) => a.localeCompare(b, "pl"))) {
    const matched = usersByName.get(normalizeText(scoutNameRaw)) ?? null;
    if (!matched) unmapped.push(scoutNameRaw);

    const obsCount = scoutToObservations.get(scoutNameRaw) ?? 0;
    const playersCount = scoutToPlayers.get(scoutNameRaw)?.size ?? 0;

    summaries.push({
      scoutNameRaw,
      matchedUserId: matched?.id ?? null,
      matchedEmail: matched?.email ?? null,
      observations: obsCount,
      uniquePlayers: playersCount,
    });
  }

  report.scouts.totalUniqueScoutNames = scoutNameSet.size;
  report.scouts.unmappedNames = unmapped;
  report.scouts.unmapped = unmapped.length;
  report.scouts.mapped = scoutNameSet.size - unmapped.length;
  report.scouts.summaries = summaries;

  report.finishedAt = new Date().toISOString();

  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `preflight-senior-${nowIsoCompact()}.json`);
  const rejectedPath = path.join(REPORTS_DIR, `preflight-senior-rejected-${nowIsoCompact()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");
  await fs.writeFile(rejectedPath, JSON.stringify(report.rejected, null, 2), "utf-8");

  console.log(`Preflight done. Report: ${reportPath}`);
  console.log(`Rejected: ${rejectedPath}`);
  console.log(`Unique scouts: ${report.scouts.totalUniqueScoutNames} (mapped=${report.scouts.mapped}, unmapped=${report.scouts.unmapped})`);
  console.log(`Totals: observations=${report.totals.observations}, uniquePlayers=${report.totals.uniquePlayers}, rejected=${report.rejected.length}`);

  if (failOnUnmapped && unmapped.length > 0) {
    console.error("Unmapped scout names:");
    for (const name of unmapped) console.error(`- ${name}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("Preflight failed:", err);
  process.exit(1);
});

