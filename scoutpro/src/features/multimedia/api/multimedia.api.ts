import { supabase } from "@/lib/supabase";
import type { Multimedia, MultimediaInsert } from "../types";
import { MEDIA_BUCKET } from "../types";

/** Error code when the multimedia table does not exist (migrations not applied). */
export const MULTIMEDIA_TABLE_MISSING_CODE = "MULTIMEDIA_TABLE_MISSING";

/** True if the error indicates the multimedia table/relation is missing (e.g. 404 / PGRST116). */
function isMultimediaTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; status?: number; message?: string };
  return (
    e.status === 404 ||
    e.code === "PGRST116" ||
    e.code === "42P01" ||
    (typeof e.message === "string" && e.message.includes("multimedia"))
  );
}

function throwTableMissing(): never {
  const err = new Error("Multimedia nie są jeszcze skonfigurowane na bazie.");
  (err as Error & { code: string }).code = MULTIMEDIA_TABLE_MISSING_CODE;
  throw err;
}

export async function fetchMultimediaByPlayer(playerId: string): Promise<Multimedia[]> {
  const { data, error } = await supabase
    .from("multimedia")
    .select("*, observation:observations(observation_date, competition)")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error && isMultimediaTableMissing(error)) throwTableMissing();
  if (error) throw error;
  return (data ?? []) as Multimedia[];
}

export async function fetchMultimediaByObservation(observationId: string): Promise<Multimedia[]> {
  const { data, error } = await supabase
    .from("multimedia")
    .select("*")
    .eq("observation_id", observationId)
    .order("created_at", { ascending: false });

  if (error && isMultimediaTableMissing(error)) throwTableMissing();
  if (error) throw error;
  return (data ?? []) as Multimedia[];
}

export async function uploadMediaFile(params: {
  file: File;
  playerId: string;
  observationId: string | null;
  createdBy: string;
}): Promise<Multimedia> {
  const { file, playerId, observationId, createdBy } = params;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const safeName = `${crypto.randomUUID()}_${Date.now()}.${ext}`;
  const path = observationId
    ? `players/${playerId}/observations/${observationId}/${safeName}`
    : `players/${playerId}/profile/${safeName}`;

  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const fileType = file.type.startsWith("image/") ? "image" : "video";
  const row: MultimediaInsert = {
    player_id: playerId,
    observation_id: observationId ?? null,
    file_name: file.name,
    file_type: fileType,
    file_size: file.size,
    file_format: ext,
    storage_path: path,
    created_by: createdBy,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("multimedia")
    .insert(row)
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw insertError;
  }

  return inserted as Multimedia;
}

export async function addYoutubeLink(params: {
  playerId: string;
  observationId: string | null;
  youtubeUrl: string;
  videoId: string;
  createdBy: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
}): Promise<Multimedia> {
  const row: MultimediaInsert = {
    player_id: params.playerId,
    observation_id: params.observationId ?? null,
    file_name: params.title ?? params.youtubeUrl,
    file_type: "youtube_link",
    youtube_url: params.youtubeUrl,
    youtube_video_id: params.videoId,
    youtube_title: params.title ?? null,
    youtube_thumbnail_url: params.thumbnailUrl ?? null,
    youtube_duration_seconds: params.durationSeconds ?? null,
    created_by: params.createdBy,
  };

  const { data, error } = await supabase.from("multimedia").insert(row).select().single();
  if (error) throw error;
  return data as Multimedia;
}

export async function deleteMultimedia(id: string): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from("multimedia")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  if (!row) throw new Error("Multimedia not found");

  if (row.storage_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([row.storage_path]);
  }

  const { error: deleteError } = await supabase.from("multimedia").delete().eq("id", id);
  if (deleteError) throw deleteError;
}

export function getMultimediaPublicUrl(storagePath: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

export function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/0.jpg`;
}

export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
