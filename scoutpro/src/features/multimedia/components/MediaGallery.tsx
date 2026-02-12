import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Film, Image as ImageIcon, Link2 } from "lucide-react";
import { getMultimediaPublicUrl, getYoutubeThumbnailUrl } from "../api/multimedia.api";
import type { MediaGalleryItem, MultimediaFileType } from "../types";
import { isLegacyMediaItem } from "../types";
import { MediaLightbox } from "./MediaLightbox";
import { cn } from "@/lib/utils";

const FILTERS: { value: "all" | MultimediaFileType; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "image", label: "Zdjęcia" },
  { value: "video", label: "Video" },
  { value: "youtube_link", label: "Linki" },
];

function getThumbSrc(m: MediaGalleryItem): string | null {
  if (isLegacyMediaItem(m)) {
    if (m.file_type === "youtube_link" && m.youtube_video_id)
      return getYoutubeThumbnailUrl(m.youtube_video_id);
    return m.url || null;
  }
  if (m.file_type === "youtube_link" && m.youtube_video_id)
    return getYoutubeThumbnailUrl(m.youtube_video_id);
  if (m.storage_path) return getMultimediaPublicUrl(m.storage_path);
  return null;
}

function getObservationLabel(m: MediaGalleryItem): { date: string; obs: string } {
  if (isLegacyMediaItem(m)) {
    const dateLabel = m.observation_date
      ? format(parseISO(m.observation_date), "dd.MM.yyyy")
      : "—";
    return { date: dateLabel, obs: m.competition ?? "Bez obserwacji" };
  }
  const dateLabel = m.observation?.observation_date
    ? format(parseISO(m.observation.observation_date), "dd.MM.yyyy")
    : "—";
  return { date: dateLabel, obs: m.observation?.competition ?? "Bez obserwacji" };
}

type MediaGalleryProps = {
  items: MediaGalleryItem[];
  filter?: "all" | MultimediaFileType;
  onFilterChange?: (filter: "all" | MultimediaFileType) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
};

export function MediaGallery({
  items,
  filter = "all",
  onFilterChange,
  onDelete,
  emptyMessage = "Brak multimediów.",
}: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered: MediaGalleryItem[] =
    filter === "all"
      ? items
      : items.filter((m) => m.file_type === filter);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);

  return (
    <div className="space-y-4">
      {onFilterChange && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((m, i) => {
            const thumbSrc = getThumbSrc(m);
            const { date: dateLabel, obs: obsLabel } = getObservationLabel(m);
            const fileName = isLegacyMediaItem(m) ? m.file_name ?? "Multimedia" : m.file_name;

            return (
              <div
                key={m.id}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => openLightbox(i)}
                  aria-label="Podgląd"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-100">
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={fileName}
                        className="h-full w-full object-cover transition group-hover:opacity-90"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {m.file_type === "youtube_link" ? (
                          <Link2 className="h-10 w-10 text-slate-400" />
                        ) : m.file_type === "video" ? (
                          <Film className="h-10 w-10 text-slate-400" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-slate-400" />
                        )}
                      </div>
                    )}
                    {m.file_type === "video" && thumbSrc && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                          <Film className="h-6 w-6 text-slate-700" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-slate-700">{dateLabel}</p>
                    <p className="truncate text-xs text-slate-500">{obsLabel}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <MediaLightbox
        items={filtered}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && closeLightbox()}
        onDelete={
          onDelete
            ? (id) => {
                const item = filtered.find((x) => x.id === id);
                if (item && !isLegacyMediaItem(item)) onDelete(id);
              }
            : undefined
        }
      />
    </div>
  );
}
