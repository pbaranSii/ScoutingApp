import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type InvitePayload = {
  email: string;
  redirectTo?: string | null;
  access_token?: string | null;
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

  let payload: InvitePayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const authHeader =
    req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
  const tokenFromBody =
    payload.access_token && typeof payload.access_token === "string"
      ? payload.access_token.trim()
      : "";
  const token = tokenFromHeader || tokenFromBody;
  if (!token) {
    return jsonResponse(
      { error: "Brak tokenu autoryzacji. Zaloguj sie ponownie.", code: "NO_TOKEN" },
      { status: 401 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    const reason = authError?.message ?? "Nieprawidlowy lub wygasly token.";
    return jsonResponse(
      { error: `Autoryzacja nie powiodla sie: ${reason}`, code: "AUTH_FAILED" },
      { status: 401 }
    );
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("users")
    .select("role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (adminError || !adminRow || adminRow.role !== "admin" || !adminRow.is_active) {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  if (!payload.email || typeof payload.email !== "string") {
    return jsonResponse({ error: "Email is required" }, { status: 400 });
  }

  const redirectTo =
    payload.redirectTo && typeof payload.redirectTo === "string"
      ? payload.redirectTo.trim()
      : null;
  if (!redirectTo) {
    return jsonResponse({ error: "redirectTo is required in body" }, { status: 400 });
  }

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    payload.email,
    { redirectTo }
  );

  if (inviteError) {
    const raw = inviteError.message;
    const hint =
      /redirect|url|allowed/i.test(raw)
        ? " Dodaj adres przekierowania w Supabase: Authentication → URL Configuration → Redirect URLs."
        : "";
    return jsonResponse(
      { error: raw + hint },
      { status: 400 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const inviteToken = crypto.randomUUID();

  await supabaseAdmin.from("invitations").insert({
    email: payload.email,
    invited_by: authData.user.id,
    token: inviteToken,
    expires_at: expiresAt.toISOString(),
  });

  const invitedUserId = inviteData?.user?.id;
  if (invitedUserId) {
    await supabaseAdmin.from("users").insert({
      id: invitedUserId,
      email: payload.email,
      full_name: inviteData.user.user_metadata?.full_name ?? null,
      role: "user",
      business_role: "scout",
      is_active: true,
    });
  }

  return jsonResponse({ ok: true, user_id: invitedUserId });
});
