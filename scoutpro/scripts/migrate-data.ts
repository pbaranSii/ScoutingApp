import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

type SupabaseClient = ReturnType<typeof createClient<Database>>;

const DEV_SUPABASE_URL = process.env.DEV_SUPABASE_URL;
const DEV_SUPABASE_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;
const PROD_SUPABASE_URL = process.env.PROD_SUPABASE_URL;
const PROD_SUPABASE_SERVICE_ROLE_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
const MIGRATE_MODE = process.env.MIGRATE_MODE ?? "invite";
const MIGRATE_DEFAULT_PASSWORD = process.env.MIGRATE_DEFAULT_PASSWORD;
const ALLOW_ORPHAN_USERS = process.env.ALLOW_ORPHAN_USERS === "true";

if (!DEV_SUPABASE_URL || !DEV_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing DEV_SUPABASE_URL or DEV_SUPABASE_SERVICE_ROLE_KEY.");
}
if (!PROD_SUPABASE_URL || !PROD_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing PROD_SUPABASE_URL or PROD_SUPABASE_SERVICE_ROLE_KEY.");
}
if (MIGRATE_MODE === "password" && !MIGRATE_DEFAULT_PASSWORD) {
  throw new Error("Missing MIGRATE_DEFAULT_PASSWORD for password mode.");
}

const devClient = createClient<Database>(DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prodClient = createClient<Database>(PROD_SUPABASE_URL, PROD_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABLE_ORDER: (keyof Database["public"]["Tables"])[] = [
  "regions",
  "categories",
  "positions",
  "evaluation_criteria",
  "leagues",
  "clubs",
  "users",
  "players",
  "matches",
  "observations",
  "player_contacts",
  "player_evaluations",
  "pipeline_history",
  "offline_queue",
  "invitations",
];

const USER_ID_COLUMNS: Record<string, string[]> = {
  users: ["id"],
  observations: ["scout_id"],
  matches: ["created_by"],
  pipeline_history: ["changed_by"],
  offline_queue: ["user_id"],
  invitations: ["invited_by"],
};

const PAGE_SIZE = 1000;
const UPSERT_CHUNK = 500;

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function listAllAuthUsers(client: SupabaseClient) {
  const users: { id: string; email?: string | null }[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;
    users.push(...data.users.map((user) => ({ id: user.id, email: user.email })));
    if (data.users.length < PAGE_SIZE) break;
    page += 1;
  }

  return users;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function ensureProdAuthUser(
  email: string,
  prodByEmail: Map<string, string>
) {
  const existing = prodByEmail.get(email);
  if (existing) return existing;

  if (MIGRATE_MODE === "invite") {
    const { data, error } = await prodClient.auth.admin.inviteUserByEmail(email);
    if (error) throw error;
    const userId = data.user?.id;
    if (!userId) throw new Error(`Invite returned no user id for ${email}`);
    prodByEmail.set(email, userId);
    return userId;
  }

  const { data, error } = await prodClient.auth.admin.createUser({
    email,
    password: MIGRATE_DEFAULT_PASSWORD!,
    email_confirm: true,
  });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error(`CreateUser returned no user id for ${email}`);
  prodByEmail.set(email, userId);
  return userId;
}

async function buildUserIdMap() {
  const prodAuthUsers = await listAllAuthUsers(prodClient);
  const prodByEmail = new Map(
    prodAuthUsers
      .map((user) => [normalizeEmail(user.email), user.id] as const)
      .filter(([email]) => email)
  );

  const { data: devUsers, error } = await devClient
    .from("users")
    .select("id, email");
  if (error) throw error;
  if (!devUsers) return new Map<string, string>();

  const map = new Map<string, string>();
  for (const devUser of devUsers) {
    const email = normalizeEmail(devUser.email);
    if (!email) {
      if (ALLOW_ORPHAN_USERS) {
        console.warn(`Dev user ${devUser.id} has no email. Keeping id as-is.`);
        map.set(devUser.id, devUser.id);
        continue;
      }
      throw new Error(`Dev user ${devUser.id} is missing email.`);
    }
    if (!isValidEmail(email)) {
      if (ALLOW_ORPHAN_USERS) {
        console.warn(`Invalid email '${email}' for ${devUser.id}. Keeping id as-is.`);
        map.set(devUser.id, devUser.id);
        continue;
      }
      throw new Error(`Invalid email '${email}' for dev user ${devUser.id}.`);
    }
    try {
      const prodId = await ensureProdAuthUser(email, prodByEmail);
      map.set(devUser.id, prodId);
    } catch (error) {
      if (ALLOW_ORPHAN_USERS) {
        console.warn(`Failed to create auth user for ${email}. Keeping id as-is.`);
        map.set(devUser.id, devUser.id);
        continue;
      }
      throw error;
    }
  }

  return map;
}

async function fetchAllRows<T extends keyof Database["public"]["Tables"]>(
  client: SupabaseClient,
  table: T
) {
  const rows: Database["public"]["Tables"][T]["Row"][] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await client.from(table).select("*").range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function remapUserIds<T extends Record<string, unknown>>(
  rows: T[],
  columns: string[],
  userIdMap: Map<string, string>
) {
  return rows.map((row) => {
    const next = { ...row } as Record<string, unknown>;
    for (const column of columns) {
      const value = next[column];
      if (!value) continue;
      const mapped = userIdMap.get(String(value));
      if (!mapped) {
        throw new Error(`Missing user id mapping for ${column}=${value}`);
      }
      next[column] = mapped;
    }
    return next as T;
  });
}

async function upsertRows<T extends keyof Database["public"]["Tables"]>(
  client: SupabaseClient,
  table: T,
  rows: Database["public"]["Tables"][T]["Row"][]
) {
  let processed = 0;
  for (const chunk of chunkArray(rows, UPSERT_CHUNK)) {
    const { error } = await client.from(table).upsert(chunk, { onConflict: "id" });
    if (error) throw error;
    processed += chunk.length;
  }
  return processed;
}

async function run() {
  const userIdMap = await buildUserIdMap();
  const results: Record<string, number> = {};

  for (const table of TABLE_ORDER) {
    const rows = await fetchAllRows(devClient, table);
    if (rows.length === 0) {
      results[table] = 0;
      continue;
    }

    const userColumns = USER_ID_COLUMNS[table];
    const remapped = userColumns ? remapUserIds(rows, userColumns, userIdMap) : rows;
    const processed = await upsertRows(prodClient, table, remapped);
    results[table] = processed;
    console.log(`Upserted ${processed} rows into ${table}.`);
  }

  console.log("Data migration completed.");
  console.log(results);
}

run().catch((error) => {
  console.error("Data migration failed:", error);
  process.exit(1);
});
