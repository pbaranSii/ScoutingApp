import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database.types";

function parseEnvFile(filePath: string) {
  const out: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return out;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

function requireEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function run() {
  const runId = process.argv[2];
  if (!runId) throw new Error("Usage: npx tsx scripts/reports/supabase-validate-transfer-run.ts <runId>");

  const envTarget = parseEnvFile(path.join(process.cwd(), ".env"));
  const TGT_SUPABASE_URL = requireEnv("TGT_SUPABASE_URL", envTarget.SUPABASE_URL);
  const TGT_SERVICE_ROLE_KEY = requireEnv("TGT_SERVICE_ROLE_KEY", envTarget.SUPABASE_SERVICE_ROLE_KEY);

  const target = createClient<Database>(TGT_SUPABASE_URL, TGT_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: runRow, error: runErr } = await target
    .from("import_runs")
    .select("id,status,created_at,source_instance,bundle_version,stats")
    .eq("id", runId)
    .single();
  if (runErr) throw runErr;

  const [{ count: playersTotal, error: pErr }, { count: obsTotal, error: oErr }] = await Promise.all([
    target.from("players").select("*", { count: "exact", head: true }),
    target.from("observations").select("*", { count: "exact", head: true }),
  ]);
  if (pErr) throw pErr;
  if (oErr) throw oErr;

  const [{ count: obsNoScout, error: nsErr }, { count: playersNoCreatedBy, error: pcbErr }] = await Promise.all([
    target.from("observations").select("*", { count: "exact", head: true }).is("scout_id", null),
    target.from("players").select("*", { count: "exact", head: true }).is("created_by", null),
  ]);
  if (nsErr) throw nsErr;
  if (pcbErr) throw pcbErr;

  console.log(JSON.stringify({
    run: {
      id: runRow.id,
      status: runRow.status,
      created_at: runRow.created_at,
      source_instance: runRow.source_instance,
      bundle_version: runRow.bundle_version,
      publish: (runRow.stats as any)?.publish ?? null,
    },
    totals: {
      players: playersTotal ?? null,
      observations: obsTotal ?? null,
    },
    checks: {
      observations_without_scout_id: obsNoScout ?? null,
      players_without_created_by: playersNoCreatedBy ?? null,
    }
  }, null, 2));
}

run().catch((e) => {
  console.error("Validation failed:", e);
  process.exit(1);
});

