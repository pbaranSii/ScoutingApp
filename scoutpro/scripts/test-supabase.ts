import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? "pbaran@sii.pl";
const adminPassword = process.env.ADMIN_PASSWORD ?? "pbaran";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authError) throw authError;

  const userId = authData.user?.id ?? "unknown";
  console.log(`Signed in as ${adminEmail} (${userId})`);

  const createPayload = {
    first_name: "Test",
    last_name: "Supabase",
    birth_year: new Date().getFullYear() - 14,
    pipeline_status: "observed" as Database["public"]["Enums"]["pipeline_status"],
  };

  const { data: createdPlayer, error: createError } = await supabase
    .from("players")
    .insert(createPayload)
    .select()
    .single();
  if (createError) throw createError;

  console.log(`Created player: ${createdPlayer.id}`);

  const { data: updatedPlayer, error: updateError } = await supabase
    .from("players")
    .update({ last_name: "Supabase-Updated" })
    .eq("id", createdPlayer.id)
    .select()
    .single();
  if (updateError) throw updateError;

  console.log(`Updated player: ${updatedPlayer.id}`);

  const { error: deleteError } = await supabase
    .from("players")
    .delete()
    .eq("id", createdPlayer.id);
  if (deleteError) {
    console.warn("Cleanup failed (delete):", deleteError.message);
    return;
  }

  console.log(`Deleted player: ${createdPlayer.id}`);
}

run().catch((error) => {
  console.error("Supabase test failed:", error);
  process.exit(1);
});
