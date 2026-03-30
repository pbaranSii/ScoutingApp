import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database.types";

type SupabaseClient = ReturnType<typeof createClient<Database>>;

type BundleV1 = {
  bundleVersion: "1.0";
  createdAt: string;
  sourceInstance: string;
  exportedBy: { userId: string; email?: string | null };
  users: Array<{
    sourceId: string;
    email: string;
    full_name?: string | null;
    role?: "admin" | "user";
    business_role?: "scout" | "coach" | "director" | "suspended" | "admin";
    area_access?: "AKADEMIA" | "SENIOR" | "ALL";
    is_active?: boolean;
  }>;
  clubs: Array<{ name: string; area?: string | null; is_active?: boolean }>;
  regions: Array<{ name: string; is_active?: boolean }>;
  categories: Array<{ name: string; area?: string | null; is_active?: boolean }>;
  players: Array<{
    sourceId: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    birth_date?: string | null;
    nationality?: string | null;
    dominant_foot?: "left" | "right" | "both" | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    body_build?: string | null;
    primary_position?: string | null;
    secondary_positions?: string[] | null;
    contract_end_date?: string | null;
    club_name?: string | null;
    region_name?: string | null;
    age_category_name?: string | null;
    age_category_area?: string | null;
    created_by_email?: string | null;
    extras?: Record<string, unknown> | null;
  }>;
  observations: Array<{
    sourceId: string;
    player_sourceId: string;
    scout_email: string;
    observation_date: string;
    source?: string;
    status?: string;
    notes?: string | null;
    summary?: string | null;
    rank?: string | null;
    competition?: string | null;
    potential_now?: number | null;
    potential_future?: number | null;
    recommendation?: string | null;
    created_by_email?: string | null;
    updated_by_email?: string | null;
    extras?: Record<string, unknown> | null;
  }>;
};

function normalizeEmail(email: string) {
  return (email ?? "").trim().toLowerCase();
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function requireEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function exportBundle(source: SupabaseClient) {
  const [{ data: players, error: pErr }, { data: observations, error: oErr }] = await Promise.all([
    source.from("players").select("*"),
    source.from("observations").select("*"),
  ]);
  if (pErr) throw pErr;
  if (oErr) throw oErr;

  const userIds = new Set<string>();
  for (const o of observations ?? []) {
    if (o.scout_id) userIds.add(String(o.scout_id));
    // @ts-expect-error db typings may not include audit cols
    if (o.created_by) userIds.add(String(o.created_by));
    // @ts-expect-error db typings may not include audit cols
    if (o.updated_by) userIds.add(String(o.updated_by));
  }
  for (const p of players ?? []) {
    // @ts-expect-error db typings may not include created_by
    if ((p as any).created_by) userIds.add(String((p as any).created_by));
  }

  const { data: users, error: uErr } = await source
    .from("users")
    .select("id,email,full_name,role,business_role,area_access,is_active")
    .in("id", Array.from(userIds));
  if (uErr) throw uErr;

  const clubIds = new Set<string>();
  const regionIds = new Set<string>();
  const categoryIds = new Set<string>();
  for (const p of players ?? []) {
    // @ts-expect-error db typings
    if ((p as any).club_id) clubIds.add(String((p as any).club_id));
    // @ts-expect-error db typings
    if ((p as any).region_id) regionIds.add(String((p as any).region_id));
    // @ts-expect-error db typings
    if ((p as any).age_category_id) categoryIds.add(String((p as any).age_category_id));
  }

  const [{ data: clubs }, { data: regions }, { data: categories }] = await Promise.all([
    clubIds.size ? source.from("clubs").select("id,name,area,is_active").in("id", Array.from(clubIds)) : Promise.resolve({ data: [] as any }),
    regionIds.size ? source.from("regions").select("id,name,is_active").in("id", Array.from(regionIds)) : Promise.resolve({ data: [] as any }),
    categoryIds.size ? source.from("categories").select("id,name,area,is_active").in("id", Array.from(categoryIds)) : Promise.resolve({ data: [] as any }),
  ]);

  const usersById = new Map((users ?? []).map((u) => [String(u.id), u] as const));
  const clubsById = new Map(((clubs?.data ?? clubs) ?? []).map((c: any) => [String(c.id), c]));
  const regionsById = new Map(((regions?.data ?? regions) ?? []).map((r: any) => [String(r.id), r]));
  const categoriesById = new Map(((categories?.data ?? categories) ?? []).map((c: any) => [String(c.id), c]));

  const bundle: BundleV1 = {
    bundleVersion: "1.0",
    createdAt: new Date().toISOString(),
    sourceInstance: "digrvtbfonatvytwpbbn",
    exportedBy: { userId: "service_role", email: null },
    users: (users ?? []).map((u: any) => ({
      sourceId: String(u.id),
      email: u.email,
      full_name: u.full_name ?? null,
      role: u.role ?? "user",
      business_role: u.business_role ?? "scout",
      area_access: u.area_access ?? "AKADEMIA",
      is_active: u.is_active ?? true,
    })),
    clubs: ((clubs?.data ?? clubs) ?? []) as any,
    regions: ((regions?.data ?? regions) ?? []) as any,
    categories: ((categories?.data ?? categories) ?? []) as any,
    players: (players ?? []).map((p: any) => ({
      sourceId: String(p.id),
      first_name: p.first_name,
      last_name: p.last_name,
      birth_year: p.birth_year,
      birth_date: p.birth_date ?? null,
      nationality: p.nationality ?? null,
      dominant_foot: p.dominant_foot ?? null,
      height_cm: p.height_cm ?? null,
      weight_kg: p.weight_kg ?? null,
      body_build: p.body_build ?? null,
      primary_position: p.primary_position ?? null,
      secondary_positions: p.secondary_positions ?? null,
      contract_end_date: p.contract_end_date ?? null,
      club_name: clubsById.get(String(p.club_id ?? ""))?.name ?? null,
      region_name: regionsById.get(String(p.region_id ?? ""))?.name ?? null,
      age_category_name: categoriesById.get(String(p.age_category_id ?? ""))?.name ?? null,
      age_category_area: categoriesById.get(String(p.age_category_id ?? ""))?.area ?? null,
      created_by_email: usersById.get(String(p.created_by ?? ""))?.email ?? null,
      extras: null,
    })),
    observations: (observations ?? []).map((o: any) => ({
      sourceId: String(o.id),
      player_sourceId: String(o.player_id),
      scout_email: usersById.get(String(o.scout_id))?.email ?? "",
      observation_date: o.observation_date,
      source: o.source,
      status: o.status,
      notes: o.notes ?? null,
      summary: o.summary ?? null,
      rank: o.rank ?? null,
      competition: o.competition ?? null,
      potential_now: o.potential_now ?? null,
      potential_future: o.potential_future ?? null,
      recommendation: o.recommendation ?? null,
      created_by_email: usersById.get(String(o.created_by ?? ""))?.email ?? null,
      updated_by_email: usersById.get(String(o.updated_by ?? ""))?.email ?? null,
      extras: null,
    })),
  };

  return bundle;
}

function preflightBundle(bundle: BundleV1) {
  const issues: Array<{ severity: "info" | "warning" | "error"; code: string; message: string; count?: number; examples?: any }> = [];

  const users = Array.isArray(bundle.users) ? bundle.users : [];
  const players = Array.isArray(bundle.players) ? bundle.players : [];
  const observations = Array.isArray(bundle.observations) ? bundle.observations : [];

  const emails = users.map((u) => normalizeEmail(String(u.email ?? ""))).filter(Boolean);
  const missingEmails = users.filter((u) => !isNonEmptyString(u.email)).length;
  const emailCounts = new Map<string, number>();
  for (const e of emails) emailCounts.set(e, (emailCounts.get(e) ?? 0) + 1);
  const dupEmails = Array.from(emailCounts.entries()).filter(([, c]) => c > 1);
  if (missingEmails) issues.push({ severity: "error", code: "missing_user_email", message: "Some users have no email", count: missingEmails });
  if (dupEmails.length) issues.push({ severity: "error", code: "duplicate_user_email", message: "Duplicate emails in users[]", count: dupEmails.length, examples: dupEmails.slice(0, 10) });

  const playerSourceIds = new Set(players.map((p) => String(p.sourceId ?? "")).filter(Boolean));
  const missingPlayerRefs = new Map<string, number>();
  for (const o of observations) {
    const pid = String(o.player_sourceId ?? "");
    if (!pid || !playerSourceIds.has(pid)) {
      missingPlayerRefs.set(pid || "<empty>", (missingPlayerRefs.get(pid || "<empty>") ?? 0) + 1);
    }
  }
  if (missingPlayerRefs.size > 0) {
    issues.push({
      severity: "error",
      code: "missing_player_sourceId",
      message: "Some observations reference player_sourceId not present in players[]. Import blocked.",
      count: Array.from(missingPlayerRefs.values()).reduce((a, b) => a + b, 0),
      examples: Array.from(missingPlayerRefs.entries()).slice(0, 10),
    });
  }

  const ok = !issues.some((i) => i.severity === "error");
  return {
    ok,
    summary: {
      users: users.length,
      players: players.length,
      observations: observations.length,
      clubs: Array.isArray(bundle.clubs) ? bundle.clubs.length : 0,
      regions: Array.isArray(bundle.regions) ? bundle.regions.length : 0,
      categories: Array.isArray(bundle.categories) ? bundle.categories.length : 0,
    },
    userMapping: {
      missingEmails,
      duplicateEmailsInBundle: dupEmails.length,
      willCreateUsers: 0,
      willMapUsers: users.length - missingEmails,
    },
    issues,
  };
}

async function ensureUsersByEmail(target: SupabaseClient, users: BundleV1["users"]) {
  const emails = Array.from(new Set(users.map((u) => normalizeEmail(u.email)).filter(Boolean)));
  const map = new Map<string, string>();
  if (emails.length === 0) return map;

  const { data: existing, error } = await target.from("users").select("id,email").in("email", emails);
  if (error) throw error;
  for (const row of existing ?? []) map.set(normalizeEmail(row.email ?? ""), String(row.id));

  const missing = emails.filter((e) => !map.has(e));
  for (const email of missing) {
    const u = users.find((x) => normalizeEmail(x.email) === email);
    const fullName = (u?.full_name ?? null) as string | null;
    const businessRole = (u?.business_role ?? "scout") as string;
    const areaAccess = (u?.area_access ?? (businessRole === "admin" ? "ALL" : "AKADEMIA")) as string;
    const isActive = u?.is_active ?? businessRole !== "suspended";
    const role = businessRole === "admin" ? "admin" : "user";

    const { data: invited, error: inviteErr } = await target.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, business_role: businessRole, area_access: areaAccess },
    });
    if (inviteErr || !invited?.user?.id) {
      throw new Error(inviteErr?.message ?? `Failed to invite ${email}`);
    }
    const userId = invited.user.id;

    const { error: insertErr } = await target.from("users").insert({
      id: userId,
      email,
      full_name: fullName,
      role,
      business_role: businessRole,
      area_access: areaAccess,
      is_active: isActive,
    } as any);
    if (insertErr) {
      try {
        await target.auth.admin.deleteUser(userId);
      } catch {
        // ignore
      }
      throw new Error(insertErr.message);
    }
    map.set(email, userId);
  }

  return map;
}

async function run() {
  const envSource = parseEnvFile(path.join(process.cwd(), ".env.local"));
  const envTarget = parseEnvFile(path.join(process.cwd(), ".env"));

  const SRC_SUPABASE_URL = requireEnv("SRC_SUPABASE_URL", envSource.SUPABASE_URL);
  const SRC_SERVICE_ROLE_KEY = requireEnv("SRC_SERVICE_ROLE_KEY", envSource.SUPABASE_SERVICE_ROLE_KEY);
  const TGT_SUPABASE_URL = requireEnv("TGT_SUPABASE_URL", envTarget.SUPABASE_URL);
  const TGT_SERVICE_ROLE_KEY = requireEnv("TGT_SERVICE_ROLE_KEY", envTarget.SUPABASE_SERVICE_ROLE_KEY);

  const source = createClient<Database>(SRC_SUPABASE_URL, SRC_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const target = createClient<Database>(TGT_SUPABASE_URL, TGT_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log("Exporting bundle from source...");
  const bundle = await exportBundle(source);
  const preflight = preflightBundle(bundle);
  if (!preflight.ok) {
    console.error("Preflight failed:", preflight);
    process.exit(1);
  }

  console.log("Creating import_run on target...");
  const { data: runRow, error: runErr } = await target
    .from("import_runs")
    .insert({ bundle_version: bundle.bundleVersion, source_instance: bundle.sourceInstance, status: "preflight_ok", stats: preflight } as any)
    .select("id")
    .single();
  if (runErr) throw runErr;
  const runId = runRow?.id;
  if (!runId) throw new Error("Failed to create import_run");
  console.log(`runId=${runId}`);

  console.log("Ensuring users by email on target (invite missing)...");
  const userMap = await ensureUsersByEmail(target, bundle.users ?? []);

  console.log("Upserting import_user_map...");
  const mapRows = (bundle.users ?? [])
    .map((u) => {
      const email = normalizeEmail(u.email);
      const targetUserId = userMap.get(email) ?? null;
      return email
        ? {
            run_id: runId,
            source_user_id: u.sourceId,
            source_email: email,
            target_user_id: targetUserId,
            resolution_status: targetUserId ? "mapped" : "unresolved",
          }
        : null;
    })
    .filter(Boolean) as any[];

  for (const chunk of chunkArray(mapRows, 500)) {
    const { error } = await target.from("import_user_map").upsert(chunk, { onConflict: "run_id,source_email" });
    if (error) throw error;
  }

  console.log("Staging bundle snapshot...");
  const { error: stgErr } = await target.from("import_stg_bundle").upsert({ run_id: runId, bundle } as any, { onConflict: "run_id" });
  if (stgErr) throw stgErr;
  await target.from("import_runs").update({ status: "staged" } as any).eq("id", runId);

  console.log("Publishing (RPC)...");
  const { data: publishResult, error: pubErr } = await target.rpc("admin_data_transfer_publish", { p_run_id: runId } as any);
  if (pubErr) throw pubErr;
  console.log("Publish result:", publishResult);
}

run().catch((e) => {
  console.error("Transfer failed:", e);
  process.exit(1);
});

