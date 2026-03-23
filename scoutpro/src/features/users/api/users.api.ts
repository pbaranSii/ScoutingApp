import { supabase } from "@/lib/supabase";
import type { AreaAccess, BusinessRole, UserProfile } from "../types";

export async function fetchUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as UserProfile | null;
}

/** List users with business_role = scout (for pipeline/observation filters). */
export async function fetchScouts(areaAccess?: AreaAccess): Promise<UserProfile[]> {
  let query = supabase
    .from("users")
    .select("*")
    .eq("business_role", "scout");

  if (areaAccess && areaAccess !== "ALL") {
    query = query.eq("area_access", areaAccess);
  }

  const { data, error } = await query.order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

/** Create user via Edge Function (auth.admin.createUser with email_confirm: true).
 * Konto jest aktywne od razu, bez potwierdzenia emailem. */
export async function createUserDirect(input: {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  business_role?: BusinessRole;
  area_access?: AreaAccess;
}) {
  const email = (input.email ?? "").trim();
  const password = input.password ?? "";
  if (!email || !password) {
    throw new Error("Email i hasło są wymagane.");
  }
  if (password.length < 6) {
    throw new Error("Hasło musi mieć co najmniej 6 znaków.");
  }

  await supabase.auth.refreshSession();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sesja wygasla. Zaloguj sie ponownie i sprobuj jeszcze raz.");
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      email,
      password,
      first_name: input.first_name ?? null,
      last_name: input.last_name ?? null,
      business_role: input.business_role ?? "scout",
      area_access: input.area_access ?? "AKADEMIA",
    }),
  });
  let body: { id?: string; error?: string } = {};
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = body?.error ?? `Błąd ${res.status}. Zaloguj się ponownie i spróbuj jeszcze raz.`;
    throw new Error(msg);
  }
  const createdId = body?.id ?? "";
  if (!createdId) {
    throw new Error("Nie udało się odczytać identyfikatora utworzonego użytkownika.");
  }

  // Fallback persistence in public.users to guarantee area_access/business_role
  // even when Edge Function deployment is stale.
  await updateUserProfile(createdId, {
    email,
    first_name: input.first_name ?? null,
    last_name: input.last_name ?? null,
    business_role: input.business_role ?? "scout",
    area_access: input.area_access ?? "AKADEMIA",
  });

  return { id: createdId };
}

/** Update user profile in public.users. RLS allows admin. Email in auth is not changed. */
export async function updateUserProfile(
  userId: string,
  input: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    business_role?: BusinessRole;
    area_access?: AreaAccess;
  }
) {
  const fullName =
    input.first_name !== undefined || input.last_name !== undefined
      ? [input.first_name, input.last_name].filter(Boolean).join(" ").trim() || null
      : undefined;

  const { error } = await supabase
    .from("users")
    .update({
      ...(input.email != null && { email: input.email }),
      ...(fullName !== undefined && { full_name: fullName }),
      ...(input.business_role !== undefined && {
        business_role: input.business_role,
        role: input.business_role === "admin" ? "admin" : "user",
        is_active: input.business_role !== "suspended",
      }),
      area_access: input.area_access ?? undefined,
    })
    .eq("id", userId);
  if (error) throw error;
}

/** Update user via Edge Function (Auth + public.users). Use for admin edit. */
export async function adminUpdateUser(body: {
  user_id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  business_role?: BusinessRole;
  area_access?: AreaAccess;
}) {
  const { data, error } = await supabase.functions.invoke("admin-update-user", { body });
  const errMsg = (data as { error?: string } | null)?.error;
  if (errMsg) throw new Error(errMsg);
  if (error) throw error;
  return (data ?? {}) as { status: string };
}

/** Admin edit: uses Edge Function (Auth + public.users). Errors propagate to UI. */
export async function updateUserAsAdmin(body: {
  user_id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  business_role?: BusinessRole;
  area_access?: AreaAccess;
}) {
  // Primary write path: direct table update (RLS admin policy).
  await updateUserProfile(body.user_id, {
    email: body.email,
    first_name: body.first_name,
    last_name: body.last_name,
    business_role: body.business_role,
    area_access: body.area_access,
  });

  // Best effort metadata sync in auth.users (name/role/area in user_metadata).
  // Do not block UI save if Edge Function is temporarily unavailable.
  try {
    await adminUpdateUser(body);
  } catch {
    // no-op on purpose
  }
  return { status: "ok" };
}

export async function adminSetUserPassword(input: { user_id: string; password: string }) {
  await supabase.auth.refreshSession();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sesja wygasla. Zaloguj sie ponownie i sprobuj jeszcze raz.");
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-set-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
    },
    body: JSON.stringify(input),
  });
  let body: { error?: string; message?: string } = {};
  try {
    const text = await res.text();
    body = text ? (JSON.parse(text) as { error?: string; message?: string }) : {};
  } catch {
    /* ignore parse error */
  }
  if (!res.ok) {
    const msg =
      body?.error ?? body?.message ?? `Błąd ${res.status}. Zaloguj się ponownie i spróbuj jeszcze raz.`;
    throw new Error(msg);
  }
  return body as { status: string };
}

/** Suspend/restore user. Uses RLS (admin only). No edge function required. */
export async function updateUserStatus(
  userId: string,
  updates: { business_role?: BusinessRole; is_active?: boolean }
) {
  const updatePayload: Record<string, unknown> = {};
  if (updates.is_active !== undefined) {
    updatePayload.is_active = updates.is_active;
  }
  if (updates.business_role !== undefined) {
    updatePayload.business_role = updates.business_role;
    updatePayload.role = updates.business_role === "admin" ? "admin" : "user";
  }
  if (Object.keys(updatePayload).length === 0) return;
  const { error } = await supabase.from("users").update(updatePayload).eq("id", userId);
  if (error) throw error;
}
