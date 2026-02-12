import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type UpdateUserPayload = {
  user_id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  business_role?: "scout" | "coach" | "director" | "suspended" | "admin";
  is_active?: boolean | null;
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

  let payload: UpdateUserPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.user_id) {
    return jsonResponse({ error: "user_id is required" }, { status: 400 });
  }

  const { data: existingUser, error: existingError } = await supabaseAdmin
    .from("users")
    .select("email, full_name, role, business_role, is_active")
    .eq("id", payload.user_id)
    .single();

  if (existingError || !existingUser) {
    return jsonResponse({ error: "User not found" }, { status: 404 });
  }

  if (payload.email !== undefined && payload.email !== null && payload.email.trim() !== "") {
    const newEmail = payload.email.trim();
    const { data: existingByEmail } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", newEmail)
      .neq("id", payload.user_id)
      .maybeSingle();
    if (existingByEmail) {
      return jsonResponse(
        { error: "Użytkownik z tym adresem e-mail już istnieje." },
        { status: 400 }
      );
    }
  }

  const fullName = `${payload.first_name ?? ""} ${payload.last_name ?? ""}`.trim();
  const businessRole = payload.business_role ?? existingUser.business_role;
  const isActive =
    businessRole === "suspended"
      ? false
      : payload.is_active ?? existingUser.is_active ?? true;
  const resolvedRole = businessRole === "admin" ? "admin" : "user";

  const updateAuthPayload: Record<string, unknown> = {};
  if (payload.email) updateAuthPayload.email = payload.email;
  if (
    payload.first_name !== undefined ||
    payload.last_name !== undefined ||
    businessRole !== undefined
  ) {
    updateAuthPayload.user_metadata = {
      first_name: payload.first_name ?? null,
      last_name: payload.last_name ?? null,
      full_name: fullName || null,
      business_role: businessRole ?? null,
    };
  }

  if (Object.keys(updateAuthPayload).length > 0) {
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      payload.user_id,
      updateAuthPayload
    );
    if (updateAuthError) {
      return jsonResponse({ error: updateAuthError.message }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {
    role: resolvedRole,
    business_role: businessRole,
    is_active: isActive,
  };
  if (payload.email) updateData.email = payload.email;
  if (payload.first_name !== undefined || payload.last_name !== undefined) {
    updateData.full_name = fullName || null;
  }

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", payload.user_id);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, { status: 400 });
  }

  return jsonResponse({ status: "ok" });
});
