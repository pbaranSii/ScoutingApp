import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? "pbaran@sii.pl";
const adminPassword = process.env.ADMIN_PASSWORD ?? "pbaran";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function ensureAdminUser() {
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  if (listError) {
    throw listError;
  }

  const adminEmailLower = adminEmail.toLowerCase();
  const existingUser = listData.users.find(
    (user) => user.email?.toLowerCase() === adminEmailLower
  );
  let userId = existingUser?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user?.id;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: adminPassword,
      email_confirm: true,
    });
    if (error) throw error;
  }

  if (!userId) {
    throw new Error("Failed to resolve admin user id.");
  }

  const { error: upsertError } = await supabase.from("users").upsert(
    {
      id: userId,
      email: adminEmail,
      role: "admin",
      is_active: true,
      full_name: adminEmail.split("@")[0],
    },
    { onConflict: "id" }
  );

  if (upsertError) throw upsertError;

  console.log(`Admin ready: ${adminEmail} (${userId})`);
}

ensureAdminUser().catch((error) => {
  console.error("Admin seed failed:", error);
  process.exit(1);
});
