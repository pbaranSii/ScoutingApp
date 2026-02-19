import { supabase } from "@/lib/supabase";
import type { FavoriteList, FavoriteListMember, FavoriteListCollaborator } from "../types";

export type FavoriteListFilter = "mine" | "shared" | "all";

export async function fetchFavoriteLists(filter: FavoriteListFilter = "mine"): Promise<FavoriteList[]> {
  const { data: authUser } = await supabase.auth.getUser();
  const uid = authUser?.user ?? null;

  let query = supabase
    .from("favorite_lists")
    .select("id, name, description, owner_id, formation, region_id, last_used_at, created_at, updated_at")
    .order("last_used_at", { ascending: false, nullsFirst: false });

  if (filter === "mine") {
    if (uid) query = query.eq("owner_id", uid.id);
  } else if (filter === "shared") {
    if (uid) {
      const [collabRes, userRes] = await Promise.all([
        supabase.from("favorite_list_collaborators").select("list_id").eq("user_id", uid.id),
        supabase.from("users").select("region_id").eq("id", uid.id).maybeSingle(),
      ]);
      const listIds = (collabRes.data ?? []).map((c) => c.list_id).filter(Boolean);
      const myRegionId = userRes.data?.region_id ?? null;
      const orParts: string[] = [];
      if (listIds.length > 0) orParts.push(`id.in.(${listIds.join(",")})`);
      if (myRegionId) orParts.push(`region_id.eq.${myRegionId}`);
      if (orParts.length > 0) query = query.or(orParts.join(","));
      else query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const lists = (data ?? []) as FavoriteList[];
  const withCounts = await Promise.all(
    lists.map(async (list) => {
      const { count } = await supabase
        .from("favorite_list_members")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id);
      return { ...list, players_count: count ?? 0 } as FavoriteList;
    })
  );
  return withCounts;
}

export async function fetchFavoriteListById(id: string): Promise<FavoriteList | null> {
  const { data, error } = await supabase
    .from("favorite_lists")
    .select("id, name, description, owner_id, formation, region_id, last_used_at, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { count } = await supabase
    .from("favorite_list_members")
    .select("*", { count: "exact", head: true })
    .eq("list_id", id);
  return { ...data, players_count: count ?? 0 } as FavoriteList;
}

export async function createFavoriteList(input: {
  name: string;
  description?: string | null;
  formation?: string;
  region_id?: string | null;
}): Promise<FavoriteList> {
  const { data: authUser } = await supabase.auth.getUser();
  const uid = authUser?.user ?? null;
  if (!uid) throw new Error("Nie jesteś zalogowany.");

  const { count } = await supabase
    .from("favorite_lists")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", uid.id);
  if ((count ?? 0) >= 20) throw new Error("Możesz mieć maksymalnie 20 list. Usuń jedną z list.");

  const { data, error } = await supabase
    .from("favorite_lists")
    .insert({
      name: input.name.trim().slice(0, 100),
      description: input.description?.trim().slice(0, 500) || null,
      formation: input.formation ?? "4-4-2",
      region_id: input.region_id || null,
      owner_id: uid.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as FavoriteList;
}

export async function updateFavoriteList(
  id: string,
  input: { name?: string; description?: string | null; formation?: string; region_id?: string | null }
): Promise<FavoriteList> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim().slice(0, 100);
  if (input.description !== undefined) payload.description = input.description?.trim().slice(0, 500) || null;
  if (input.formation !== undefined) payload.formation = input.formation;
  if (input.region_id !== undefined) payload.region_id = input.region_id || null;

  const { data, error } = await supabase.from("favorite_lists").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as FavoriteList;
}

export async function deleteFavoriteList(id: string): Promise<void> {
  const { error } = await supabase.from("favorite_lists").delete().eq("id", id);
  if (error) throw error;
}

export async function touchFavoriteListLastUsed(id: string): Promise<void> {
  await supabase.from("favorite_lists").update({ last_used_at: new Date().toISOString() }).eq("id", id);
}

export async function fetchListMembers(listId: string): Promise<FavoriteListMember[]> {
  const { data, error } = await supabase
    .from("favorite_list_members")
    .select("id, list_id, player_id, added_by, added_at")
    .eq("list_id", listId)
    .order("added_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as { id: string; list_id: string; player_id: string; added_by: string; added_at: string }[];
  if (rows.length === 0) return [];
  const playerIds = [...new Set(rows.map((r) => r.player_id))];
  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, primary_position, pipeline_status, club:clubs(name)")
    .in("id", playerIds);
  const playerMap = new Map((players ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({
    ...r,
    player: playerMap.get(r.player_id) ?? undefined,
  })) as FavoriteListMember[];
}

/** Fetch members with latest observation overall_rating for average. */
export async function fetchListMembersWithRating(listId: string): Promise<
  (FavoriteListMember & { player?: { overall_rating?: number | null } })[]
> {
  const members = await fetchListMembers(listId);
  const withRating = await Promise.all(
    members.map(async (m) => {
      const { data: obs } = await supabase
        .from("observations")
        .select("overall_rating")
        .eq("player_id", m.player_id)
        .order("observation_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      const rating = obs?.overall_rating != null ? Number(obs.overall_rating) : null;
      return { ...m, player: { ...m.player, overall_rating: rating } } as FavoriteListMember & {
        player?: { overall_rating?: number | null };
      };
    })
  );
  return withRating;
}

export async function addPlayerToList(listId: string, playerId: string): Promise<FavoriteListMember> {
  const { data: authUser } = await supabase.auth.getUser();
  const uid = authUser?.user ?? null;
  if (!uid) throw new Error("Nie jesteś zalogowany.");

  const { data, error } = await supabase
    .from("favorite_list_members")
    .insert({ list_id: listId, player_id: playerId, added_by: uid.id })
    .select()
    .single();
  if (error) throw error;
  await touchFavoriteListLastUsed(listId);
  return data as FavoriteListMember;
}

export async function removePlayerFromList(listId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from("favorite_list_members")
    .delete()
    .eq("list_id", listId)
    .eq("player_id", playerId);
  if (error) throw error;
}

export async function fetchListCollaborators(listId: string): Promise<FavoriteListCollaborator[]> {
  const { data: rows, error } = await supabase
    .from("favorite_list_collaborators")
    .select("id, list_id, user_id, added_at")
    .eq("list_id", listId)
    .order("added_at", { ascending: true });
  if (error) throw error;
  const list = (rows ?? []) as { id: string; list_id: string; user_id: string; added_at: string }[];
  if (list.length === 0) return [];
  const userIds = [...new Set(list.map((c) => c.user_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, business_role")
    .in("id", userIds);
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));
  return list.map((c) => ({
    ...c,
    user: userMap.get(c.user_id) ?? undefined,
  })) as FavoriteListCollaborator[];
}

export async function addCollaborator(listId: string, userId: string): Promise<FavoriteListCollaborator> {
  const { data, error } = await supabase
    .from("favorite_list_collaborators")
    .insert({ list_id: listId, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as FavoriteListCollaborator;
}

export async function removeCollaborator(listId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("favorite_list_collaborators")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Lists that contain this player (for Add to favorites UI). */
export async function fetchListsContainingPlayer(playerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorite_list_members")
    .select("list_id")
    .eq("player_id", playerId);
  if (error) throw error;
  return (data ?? []).map((r) => r.list_id);
}

/** Count of lists that contain this player. */
export async function countListsContainingPlayer(playerId: string): Promise<number> {
  const { count, error } = await supabase
    .from("favorite_list_members")
    .select("*", { count: "exact", head: true })
    .eq("player_id", playerId);
  if (error) throw error;
  return count ?? 0;
}

/** Last used list id for current user (for quick add). */
export async function fetchLastUsedListId(): Promise<string | null> {
  const { data: authUser } = await supabase.auth.getUser();
  const uid = authUser?.user ?? null;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("favorite_lists")
    .select("id")
    .eq("owner_id", uid.id)
    .not("last_used_at", "is", null)
    .order("last_used_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
