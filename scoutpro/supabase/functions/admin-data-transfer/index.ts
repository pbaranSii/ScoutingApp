import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

type Action = "export" | "preflight" | "commit";

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

function assertAdminCaller(user: { id: string }, adminRow: { role?: string; is_active?: boolean } | null) {
  if (!adminRow || adminRow.role !== "admin" || adminRow.is_active === false) {
    throw new Error("Forbidden");
  }
}

async function exportBundle(supabaseAdmin: any, callerId: string) {
  // Export: players + observations + minimal referenced users + reference dictionaries by natural keys.
  const [{ data: players, error: pErr }, { data: observations, error: oErr }] = await Promise.all([
    supabaseAdmin.from("players").select("*"),
    supabaseAdmin.from("observations").select("*"),
  ]);
  if (pErr) throw pErr;
  if (oErr) throw oErr;

  const userIds = new Set<string>();
  for (const o of observations ?? []) {
    if (o.scout_id) userIds.add(String(o.scout_id));
    if (o.created_by) userIds.add(String(o.created_by));
    if (o.updated_by) userIds.add(String(o.updated_by));
  }
  for (const p of players ?? []) {
    if ((p as any).created_by) userIds.add(String((p as any).created_by));
  }

  const { data: users, error: uErr } = await supabaseAdmin
    .from("users")
    .select("id,email,full_name,role,business_role,area_access,is_active")
    .in("id", Array.from(userIds));
  if (uErr) throw uErr;

  const clubIds = new Set<string>();
  const regionIds = new Set<string>();
  const categoryIds = new Set<string>();
  for (const p of players ?? []) {
    if (p.club_id) clubIds.add(String(p.club_id));
    if (p.region_id) regionIds.add(String(p.region_id));
    if ((p as any).age_category_id) categoryIds.add(String((p as any).age_category_id));
  }

  const [{ data: clubs }, { data: regions }, { data: categories }] = await Promise.all([
    clubIds.size
      ? supabaseAdmin.from("clubs").select("name,area,is_active").in("id", Array.from(clubIds))
      : Promise.resolve({ data: [] }),
    regionIds.size
      ? supabaseAdmin.from("regions").select("name,is_active").in("id", Array.from(regionIds))
      : Promise.resolve({ data: [] }),
    categoryIds.size
      ? supabaseAdmin.from("categories").select("name,area,is_active").in("id", Array.from(categoryIds))
      : Promise.resolve({ data: [] }),
  ]);

  const usersById = new Map((users ?? []).map((u: any) => [u.id, u]));

  const bundle: BundleV1 = {
    bundleVersion: "1.0",
    createdAt: new Date().toISOString(),
    sourceInstance: "export",
    exportedBy: { userId: callerId, email: usersById.get(callerId)?.email ?? null },
    users: (users ?? []).map((u: any) => ({
      sourceId: String(u.id),
      email: u.email,
      full_name: u.full_name ?? null,
      role: u.role ?? "user",
      business_role: u.business_role ?? "scout",
      area_access: u.area_access ?? "AKADEMIA",
      is_active: u.is_active ?? true,
    })),
    clubs: (clubs?.data ?? clubs ?? []) as any,
    regions: (regions?.data ?? regions ?? []) as any,
    categories: (categories?.data ?? categories ?? []) as any,
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
      club_name: null,
      region_name: null,
      age_category_name: null,
      age_category_area: null,
      created_by_email: usersById.get(p.created_by ?? "")?.email ?? null,
      extras: null,
    })),
    observations: (observations ?? []).map((o: any) => ({
      sourceId: String(o.id),
      player_sourceId: String(o.player_id),
      scout_email: usersById.get(o.scout_id)?.email ?? "",
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
      created_by_email: usersById.get(o.created_by)?.email ?? null,
      updated_by_email: usersById.get(o.updated_by)?.email ?? null,
      extras: null,
    })),
  };

  return bundle;
}

function preflightBundle(bundle: unknown) {
  const issues: any[] = [];
  if (!bundle || typeof bundle !== "object") {
    return { ok: false, issues: [{ severity: "error", code: "invalid_json", message: "Invalid JSON bundle" }] };
  }
  const b = bundle as Partial<BundleV1>;
  if (b.bundleVersion !== "1.0") {
    issues.push({ severity: "error", code: "unsupported_version", message: "Unsupported bundle version" });
  }

  const users = Array.isArray(b.users) ? b.users : [];
  const players = Array.isArray(b.players) ? b.players : [];
  const observations = Array.isArray(b.observations) ? b.observations : [];

  const emails = users.map((u) => normalizeEmail(String((u as any).email ?? ""))).filter(Boolean);
  const missingEmails = users.filter((u) => !isNonEmptyString((u as any).email)).length;
  const emailCounts = new Map<string, number>();
  for (const e of emails) emailCounts.set(e, (emailCounts.get(e) ?? 0) + 1);
  const dupEmails = Array.from(emailCounts.entries()).filter(([, c]) => c > 1);
  if (missingEmails) issues.push({ severity: "error", code: "missing_user_email", message: "Some users have no email", count: missingEmails });
  if (dupEmails.length) issues.push({ severity: "error", code: "duplicate_user_email", message: "Duplicate emails in users[]", count: dupEmails.length, examples: dupEmails.slice(0, 5) });

  // Duplicate players in bundle (simple key)
  const playerKeyCounts = new Map<string, number>();
  for (const p of players) {
    const key = `${String((p as any).first_name ?? "").trim().toLowerCase()}|${String((p as any).last_name ?? "").trim().toLowerCase()}|${String((p as any).birth_year ?? "")}|${String((p as any).club_name ?? "").trim().toLowerCase()}`;
    playerKeyCounts.set(key, (playerKeyCounts.get(key) ?? 0) + 1);
  }
  const dupPlayers = Array.from(playerKeyCounts.entries()).filter(([, c]) => c > 1);
  if (dupPlayers.length) issues.push({ severity: "warning", code: "duplicate_players_in_bundle", message: "Duplicate players detected in bundle", count: dupPlayers.length, examples: dupPlayers.slice(0, 5) });

  // Duplicate observations in bundle (simple key)
  const obsKeyCounts = new Map<string, number>();
  for (const o of observations) {
    const key = `${String((o as any).player_sourceId ?? "")}|${normalizeEmail(String((o as any).scout_email ?? ""))}|${String((o as any).observation_date ?? "")}|${String((o as any).source ?? "")}`;
    obsKeyCounts.set(key, (obsKeyCounts.get(key) ?? 0) + 1);
  }
  const dupObs = Array.from(obsKeyCounts.entries()).filter(([, c]) => c > 1);
  if (dupObs.length) issues.push({ severity: "warning", code: "duplicate_observations_in_bundle", message: "Duplicate observations detected in bundle", count: dupObs.length, examples: dupObs.slice(0, 5) });

  // Critical: observations must reference existing players in bundle.
  const playerSourceIds = new Set(players.map((p) => String((p as any).sourceId ?? "")).filter(Boolean));
  const missingPlayerRefs = new Map<string, number>();
  for (const o of observations) {
    const pid = String((o as any).player_sourceId ?? "");
    if (!pid || !playerSourceIds.has(pid)) {
      missingPlayerRefs.set(pid || "<empty>", (missingPlayerRefs.get(pid || "<empty>") ?? 0) + 1);
    }
  }
  if (missingPlayerRefs.size > 0) {
    const examples = Array.from(missingPlayerRefs.entries()).slice(0, 10);
    issues.push({
      severity: "error",
      code: "missing_player_sourceId",
      message: "Some observations reference player_sourceId not present in players[]. Import blocked.",
      count: Array.from(missingPlayerRefs.values()).reduce((a, b) => a + b, 0),
      examples,
    });
  }

  const ok = !issues.some((i) => i.severity === "error");
  return {
    ok,
    bundleVersion: b.bundleVersion ?? null,
    summary: {
      users: users.length,
      players: players.length,
      observations: observations.length,
      clubs: Array.isArray(b.clubs) ? b.clubs.length : 0,
      regions: Array.isArray(b.regions) ? b.regions.length : 0,
      categories: Array.isArray(b.categories) ? b.categories.length : 0,
    },
    duplicateCheck: {
      duplicatePlayersInBundle: dupPlayers.length,
      duplicateObservationsInBundle: dupObs.length,
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

async function ensureUsersByEmail(supabaseAdmin: any, users: Array<{ email: string; full_name?: string | null; business_role?: string; area_access?: string; is_active?: boolean }>) {
  const emails = Array.from(new Set(users.map((u) => normalizeEmail(u.email)).filter(Boolean)));
  if (emails.length === 0) return new Map<string, string>();

  const { data: existing, error } = await supabaseAdmin
    .from("users")
    .select("id,email")
    .in("email", emails);
  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of existing ?? []) {
    map.set(normalizeEmail(row.email), String(row.id));
  }

  const missing = emails.filter((e) => !map.has(e));
  for (const email of missing) {
    // Create in auth + mirror in public.users; use invite flow (no password handling here).
    const u = users.find((x) => normalizeEmail(x.email) === email);
    const fullName = (u?.full_name ?? null) as string | null;
    const businessRole = (u?.business_role ?? "scout") as string;
    const areaAccess = (u?.area_access ?? (businessRole === "admin" ? "ALL" : "AKADEMIA")) as string;
    const isActive = u?.is_active ?? businessRole !== "suspended";
    const role = businessRole === "admin" ? "admin" : "user";

    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        business_role: businessRole,
        area_access: areaAccess,
      },
    });
    if (inviteErr || !invited?.user?.id) {
      throw new Error(inviteErr?.message ?? `Failed to invite ${email}`);
    }
    const userId = invited.user.id;

    const { error: insertErr } = await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      full_name: fullName,
      role,
      business_role: businessRole,
      area_access: areaAccess,
      is_active: isActive,
    });
    if (insertErr) {
      // Best effort cleanup
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch {
        // ignore
      }
      throw new Error(insertErr.message);
    }
    map.set(email, userId);
  }

  return map;
}

async function upsertRegionsClubsCategories(supabaseAdmin: any, bundle: BundleV1) {
  // Minimal reference upserts by natural keys (name).
  const regions = (bundle.regions ?? []).filter((r) => isNonEmptyString(r.name));
  const clubs = (bundle.clubs ?? []).filter((c) => isNonEmptyString(c.name));
  const categories = (bundle.categories ?? []).filter((c) => isNonEmptyString(c.name));

  for (const r of regions) {
    const { data: existing } = await supabaseAdmin.from("regions").select("id").eq("name", r.name).maybeSingle();
    if (!existing) {
      await supabaseAdmin.from("regions").insert({ name: r.name, is_active: r.is_active ?? true });
    }
  }

  for (const c of clubs) {
    // Clubs have area; keep it if provided, else default ALL.
    const { data: existing } = await supabaseAdmin.from("clubs").select("id").eq("name", c.name).maybeSingle();
    if (!existing) {
      await supabaseAdmin.from("clubs").insert({ name: c.name, is_active: c.is_active ?? true, area: c.area ?? "ALL" });
    }
  }

  for (const cat of categories) {
    const q = supabaseAdmin.from("categories").select("id").eq("name", cat.name);
    const { data: existing } = await (cat.area ? q.eq("area", cat.area) : q).maybeSingle();
    if (!existing) {
      // Create category only if missing; requires required cols depending on schema.
      await supabaseAdmin.from("categories").insert({ name: cat.name, area: cat.area ?? "AKADEMIA", is_active: cat.is_active ?? true });
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables" }, { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return jsonResponse({ error: "Missing authorization token" }, { status: 401 });

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("users")
    .select("role, is_active")
    .eq("id", authData.user.id)
    .single();
  if (adminError) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  try {
    assertAdminCaller({ id: authData.user.id }, adminRow);
  } catch {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const action = (raw?.action ?? raw?.body?.action) as Action;
  if (!action || !["export", "preflight", "commit"].includes(action)) {
    return jsonResponse({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "export") {
    const bundle = await exportBundle(supabaseAdmin, authData.user.id);
    return jsonResponse({ bundle });
  }

  if (action === "preflight") {
    const bundle = raw?.bundle ?? raw?.body?.bundle;
    const report = preflightBundle(bundle);
    // Persist import_run (preflight) for audit
    const { data: runRow } = await supabaseAdmin
      .from("import_runs")
      .insert({
        created_by: authData.user.id,
        bundle_version: String((bundle?.bundleVersion ?? "unknown")),
        source_instance: String((bundle?.sourceInstance ?? "unknown")),
        status: report.ok ? "preflight_ok" : "preflight_error",
        stats: report,
      })
      .select("id")
      .single();
    return jsonResponse({ report, runId: runRow?.id ?? null });
  }

  if (action === "commit") {
    const bundle = raw?.bundle ?? raw?.body?.bundle;
    const runId = raw?.runId ?? raw?.body?.runId;
    const report = preflightBundle(bundle);
    if (!report.ok) {
      return jsonResponse({ error: "Preflight failed; import blocked", report }, { status: 400 });
    }

    const b = bundle as BundleV1;
    if (!runId) {
      return jsonResponse({ error: "runId is required for commit" }, { status: 400 });
    }

    await supabaseAdmin.from("import_runs").update({ status: "commit_running" }).eq("id", runId);

    // 1) users mapping / creation (cannot be done inside DB transaction)
    const userMap = await ensureUsersByEmail(supabaseAdmin, b.users ?? []);
    // Persist user map for publish validation / audit
    for (const u of b.users ?? []) {
      const email = normalizeEmail(u.email);
      const target = userMap.get(email) ?? null;
      if (!email) continue;
      await supabaseAdmin.from("import_user_map").upsert(
        {
          run_id: runId,
          source_user_id: u.sourceId,
          source_email: email,
          target_user_id: target,
          resolution_status: target ? "mapped" : "unresolved",
        },
        { onConflict: "run_id,source_email" }
      );
    }

    // 2) stage full bundle snapshot in DB
    await supabaseAdmin.from("import_stg_bundle").upsert({ run_id: runId, bundle: b }, { onConflict: "run_id" });
    await supabaseAdmin.from("import_runs").update({ status: "staged" }).eq("id", runId);

    // 3) publish inside DB transaction (atomic players/observations + refs)
    const { data: publishResult, error: publishErr } = await supabaseAdmin.rpc("admin_data_transfer_publish", {
      p_run_id: runId,
    });
    if (publishErr) throw publishErr;

    return jsonResponse({ status: "ok", publish: publishResult, report });
  }

  return jsonResponse({ error: "Unhandled action" }, { status: 400 });
});

