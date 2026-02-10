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

/** Create user via Auth signUp + public.users insert. RLS allows admin to insert. */
export async function createUserDirect(input: {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  business_role?: BusinessRole;
}) {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        first_name: input.first_name ?? null,
        last_name: input.last_name ?? null,
        full_name: [input.first_name, input.last_name].filter(Boolean).join(" ").trim() || null,
        business_role: input.business_role ?? "scout",
      },
    },
  });
  if (signUpError) throw signUpError;
  const user = authData?.user;
  if (!user?.id) throw new Error("Nie udalo sie utworzyc konta.");

  const fullName = [input.first_name, input.last_name].filter(Boolean).join(" ").trim() || null;
  const businessRole = input.business_role ?? "scout";
  const role = businessRole === "admin" ? "admin" : "user";
  const isActive = businessRole !== "suspended";

  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
    email: input.email,
    full_name: fullName,
    role,
    business_role: businessRole,
    is_active: isActive,
  });
  if (insertError) throw insertError;
  return { id: user.id };
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

export async function adminSetUserPassword(input: { user_id: string; password: string }) {
  const { data, error } = await supabase.functions.invoke("admin-set-password", {
    body: input,
  });
  if (error) throw error;
  return data as { status: string };
}

/** Suspend/restore user. Uses RLS (admin only). No edge function required. */
export async function updateUserStatus(
  userId: string,
  updates: { business_role?: BusinessRole; is_active?: boolean }
) {
  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) throw error;
}
