import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

type RollbackReport = {
  batchId: string;
  startedAt: string;
  finishedAt?: string;
  deleted: {
    observations: number;
    players: number;
  };
  skipped: {
    playersWithOtherObservations: number;
  };
  errors: Array<{ stage: string; message: string }>;
};

const REPORTS_DIR = path.resolve(process.cwd(), "scripts", "reports");

function getArg(name: string): string | null {
  const direct = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (direct) return direct.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

function nowIsoCompact() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const batchId = getArg("batch-id") ?? "";
  if (!batchId) throw new Error("Missing --batch-id=<uuid>.");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report: RollbackReport = {
    batchId,
    startedAt: new Date().toISOString(),
    deleted: { observations: 0, players: 0 },
    skipped: { playersWithOtherObservations: 0 },
    errors: [],
  };

  // 1) Find players created by this batch.
  const playersRes = await (supabase as any)
    .from("players")
    .select("id")
    .eq("import_batch_id", batchId);
  if (playersRes.error) throw playersRes.error;
  const playerIds = ((playersRes.data ?? []) as Array<{ id: string }>).map((r) => r.id);

  // 2) Delete observations from this batch (cascade deletes motor_evaluations etc).
  const obsDel = await (supabase as any)
    .from("observations")
    .delete({ count: "exact" })
    .eq("import_batch_id", batchId);
  if (obsDel.error) throw obsDel.error;
  report.deleted.observations = obsDel.count ?? 0;

  // 3) Delete players from this batch only when they have no other observations.
  if (playerIds.length > 0) {
    const keep = new Set<string>();

    // Query observations for these players that were NOT from this batch.
    const otherObs = await (supabase as any)
      .from("observations")
      .select("player_id")
      .in("player_id", playerIds)
      .neq("import_batch_id", batchId);
    if (otherObs.error) throw otherObs.error;
    for (const r of (otherObs.data ?? []) as Array<{ player_id: string }>) {
      if (r.player_id) keep.add(r.player_id);
    }

    const deletable = playerIds.filter((id) => !keep.has(id));
    report.skipped.playersWithOtherObservations = keep.size;

    if (deletable.length > 0) {
      const delPlayers = await (supabase as any).from("players").delete().in("id", deletable);
      if (delPlayers.error) throw delPlayers.error;
      report.deleted.players = deletable.length;
    }
  }

  report.finishedAt = new Date().toISOString();
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `rollback-senior-${batchId}-${nowIsoCompact()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`Rollback done. Report: ${reportPath}`);
  console.log(`Deleted players: ${report.deleted.players}`);
  console.log(`Skipped players with other observations: ${report.skipped.playersWithOtherObservations}`);
}

main().catch((err) => {
  console.error("Rollback failed:", err);
  process.exit(1);
});

