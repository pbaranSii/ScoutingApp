import { parseYouTubeUrl } from "./youtube";
import type { LegacyMediaItem } from "../types";
import type { MultimediaFileType } from "../types";

type PlayerLegacy = {
  photo_urls?: string[] | null;
  video_urls?: string[] | null;
};

type ObservationLegacy = {
  id: string;
  photo_url?: string | null;
  observation_date?: string | null;
  competition?: string | null;
};

function toLegacyImage(
  url: string,
  id: string,
  meta?: { observation_date?: string | null; competition?: string | null }
): LegacyMediaItem {
  return {
    id,
    file_type: "image",
    url,
    file_name: "Zdjęcie",
    observation_date: meta?.observation_date ?? null,
    competition: meta?.competition ?? null,
    isLegacy: true,
  };
}

function toLegacyVideo(
  url: string,
  id: string,
  videoId: string | null,
  meta?: { observation_date?: string | null; competition?: string | null }
): LegacyMediaItem {
  const file_type: MultimediaFileType = videoId ? "youtube_link" : "video";
  return {
    id,
    file_type,
    url,
    youtube_video_id: videoId ?? null,
    file_name: "Wideo",
    observation_date: meta?.observation_date ?? null,
    competition: meta?.competition ?? null,
    isLegacy: true,
  };
}

/**
 * Build legacy media items from player.photo_urls, player.video_urls, and each observation.photo_url.
 */
export function buildLegacyMediaItems(
  player: PlayerLegacy,
  observations: ObservationLegacy[] = []
): LegacyMediaItem[] {
  const items: LegacyMediaItem[] = [];
  let idx = 0;

  const photoUrls = player.photo_urls ?? [];
  for (const url of photoUrls) {
    if (typeof url === "string" && url.trim()) {
      items.push(toLegacyImage(url, `legacy-photo-${idx++}`));
    }
  }

  const videoUrls = player.video_urls ?? [];
  for (const url of videoUrls) {
    if (typeof url !== "string" || !url.trim()) continue;
    const videoId = parseYouTubeUrl(url);
    items.push(toLegacyVideo(url, `legacy-video-${idx++}`, videoId));
  }

  for (const obs of observations) {
    const photoUrl = obs.photo_url?.trim();
    if (!photoUrl) continue;
    items.push(
      toLegacyImage(photoUrl, `legacy-obs-${obs.id}`, {
        observation_date: obs.observation_date,
        competition: obs.competition,
      })
    );
  }

  return items;
}

/**
 * Build legacy media items for a single observation (e.g. observation.photo_url).
 */
export function buildLegacyMediaItemsForObservation(observation: {
  id: string;
  photo_url?: string | null;
  observation_date?: string | null;
  competition?: string | null;
}): LegacyMediaItem[] {
  const url = observation.photo_url?.trim();
  if (!url) return [];
  return [
    {
      id: `legacy-obs-${observation.id}`,
      file_type: "image",
      url,
      file_name: "Zdjęcie z obserwacji",
      observation_date: observation.observation_date ?? null,
      competition: observation.competition ?? null,
      isLegacy: true,
    },
  ];
}
