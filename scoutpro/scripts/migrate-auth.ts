import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

type AuthUser = Awaited<
  ReturnType<ReturnType<typeof createClient<Database>>["auth"]["admin"]["listUsers"]>
>["data"]["users"][number];

const DEV_SUPABASE_URL = process.env.DEV_SUPABASE_URL;
const DEV_SUPABASE_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;
const PROD_SUPABASE_URL = process.env.PROD_SUPABASE_URL;
const PROD_SUPABASE_SERVICE_ROLE_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
const MIGRATE_MODE = process.env.MIGRATE_MODE ?? "password";
const MIGRATE_DEFAULT_PASSWORD = process.env.MIGRATE_DEFAULT_PASSWORD;
const COPY_METADATA = process.env.COPY_METADATA === "true";

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

async function listAllUsers(client: typeof devClient) {
  const users: AuthUser[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

async function createUserInProd(user: AuthUser) {
  const email = normalizeEmail(user.email);
  if (!email) return { skipped: true, reason: "missing email" };

  if (MIGRATE_MODE === "invite") {
    const { error } = await prodClient.auth.admin.inviteUserByEmail(email, {
      data: COPY_METADATA ? user.user_metadata : undefined,
    });
    if (error) throw error;
    return { created: true, method: "invite" };
  }

  const { error } = await prodClient.auth.admin.createUser({
    email,
    password: MIGRATE_DEFAULT_PASSWORD!,
    email_confirm: true,
    user_metadata: COPY_METADATA ? user.user_metadata : undefined,
    app_metadata: COPY_METADATA ? user.app_metadata : undefined,
  });
  if (error) throw error;
  return { created: true, method: "password" };
}

async function run() {
  const devUsers = await listAllUsers(devClient);
  const prodUsers = await listAllUsers(prodClient);
  const prodEmailSet = new Set(prodUsers.map((user) => normalizeEmail(user.email)).filter(Boolean));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of devUsers) {
    const email = normalizeEmail(user.email);
    if (!email) {
      skipped += 1;
      continue;
    }
    if (prodEmailSet.has(email)) {
      skipped += 1;
      continue;
    }

    try {
      const result = await createUserInProd(user);
      if (result.created) created += 1;
      else skipped += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed to create user ${email}:`, error);
    }
  }

  console.log("Auth migration completed.");
  console.log({
    devUsers: devUsers.length,
    prodUsers: prodUsers.length,
    created,
    skipped,
    failed,
    mode: MIGRATE_MODE,
  });
}

run().catch((error) => {
  console.error("Auth migration failed:", error);
  process.exit(1);
});
