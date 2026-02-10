import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateUserPayload = {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  business_role?: "scout" | "coach" | "director" | "suspended" | "admin";
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
    return new Response("ok", { headers: corsHeaders });
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

  let payload: CreateUserPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.email || !payload.password) {
    return jsonResponse({ error: "Email and password are required" }, { status: 400 });
  }

  const businessRole = payload.business_role ?? "scout";
  const fullName = `${payload.first_name ?? ""} ${payload.last_name ?? ""}`.trim();
  const resolvedRole = businessRole === "admin" ? "admin" : "user";
  const isActive = businessRole !== "suspended";

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      first_name: payload.first_name ?? null,
      last_name: payload.last_name ?? null,
      full_name: fullName || null,
      business_role: businessRole,
    },
  });

  if (createError || !created?.user) {
    return jsonResponse({ error: createError?.message ?? "Failed to create user" }, { status: 400 });
  }

  const userId = created.user.id;
  const { error: insertError } = await supabaseAdmin.from("users").insert({
    id: userId,
    email: payload.email,
    full_name: fullName || null,
    role: resolvedRole,
    business_role: businessRole,
    is_active: isActive,
  });

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return jsonResponse({ error: insertError.message }, { status: 400 });
  }

  return jsonResponse({ id: userId });
});
