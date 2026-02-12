import type { Database } from "@/types/database.types";

export type MultimediaFileType = Database["public"]["Enums"]["multimedia_file_type"];

export type Multimedia = {
  id: string;
  player_id: string;
  observation_id: string | null;
  file_name: string;
  file_type: MultimediaFileType;
  file_size: number | null;
  file_format: string | null;
  storage_path: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  youtube_title: string | null;
  youtube_thumbnail_url: string | null;
  youtube_duration_seconds: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  sync_status: Database["public"]["Enums"]["sync_status"];
  sync_error_message: string | null;
  observation?: { observation_date?: string; competition?: string | null } | null;
};

export type MultimediaInsert = {
  player_id: string;
  observation_id?: string | null;
  file_name?: string;
  file_type: MultimediaFileType;
  file_size?: number | null;
  file_format?: string | null;
  storage_path?: string | null;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  youtube_title?: string | null;
  youtube_thumbnail_url?: string | null;
  youtube_duration_seconds?: number | null;
  created_by: string;
  sync_status?: Database["public"]["Enums"]["sync_status"];
};

/** Legacy media from player.photo_urls, player.video_urls, observation.photo_url (display-only, no delete). */
export type LegacyMediaItem = {
  id: string;
  file_type: MultimediaFileType;
  /** Direct URL for image/video or YouTube page URL for youtube_link. */
  url: string;
  youtube_video_id?: string | null;
  file_name?: string;
  observation_date?: string | null;
  competition?: string | null;
  isLegacy: true;
};

export type MediaGalleryItem = Multimedia | LegacyMediaItem;

export function isLegacyMediaItem(item: MediaGalleryItem): item is LegacyMediaItem {
  return "isLegacy" in item && item.isLegacy === true;
}

export const MEDIA_BUCKET = "scoutpro-media";
export const MAX_IMAGE_SIZE_MB = 50;
export const MAX_VIDEO_SIZE_MB = 200;
export const MAX_MEDIA_PER_OBSERVATION = 20;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
