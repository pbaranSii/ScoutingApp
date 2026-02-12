import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PasswordPayload = {
  user_id: string;
  password: string;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables" }, { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return jsonResponse({ error: "Missing authorization token" }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("users")
    .select("role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (adminError || !adminRow || adminRow.role !== "admin" || !adminRow.is_active) {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  let payload: PasswordPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.user_id || !payload.password) {
    return jsonResponse({ error: "user_id and password are required" }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(payload.user_id, {
    password: payload.password,
  });

  if (updateError) {
    return jsonResponse({ error: updateError.message }, { status: 400 });
  }

  return jsonResponse({ status: "ok" });
});
