import { supabase } from "@/lib/supabase";
import type { BusinessRole, UserProfile } from "../types";

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
export async function fetchScouts(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("business_role", "scout")
    .order("full_name", { ascending: true });
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
  return { id: body?.id ?? "" };
}

/** Update user profile in public.users. RLS allows admin. Email in auth is not changed. */
export async function updateUserProfile(
  userId: string,
  input: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    business_role?: BusinessRole;
  }
) {
  const fullName = [input.first_name, input.last_name].filter(Boolean).join(" ").trim() || null;
  const businessRole = input.business_role ?? "scout";
  const role = businessRole === "admin" ? "admin" : "user";
  const isActive = businessRole !== "suspended";

  const { error } = await supabase
    .from("users")
    .update({
      ...(input.email != null && { email: input.email }),
      full_name: fullName,
      role,
      business_role: businessRole,
      is_active: isActive,
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
}) {
  return await adminUpdateUser(body);
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
      body?.error ?? body?.message ?? `Blad ${res.status}. Zaloguj sie ponownie i sprobuj jeszcze raz.`;
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
