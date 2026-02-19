import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMultimediaPublicUrl, getYoutubeEmbedUrl } from "../api/multimedia.api";
import type { LegacyMediaItem, MediaGalleryItem, Multimedia } from "../types";
import { isLegacyMediaItem } from "../types";

type PendingFile = { file: File; id: string };
type MediaItem = MediaGalleryItem | PendingFile;

function isPendingFile(item: MediaItem): item is PendingFile {
  return "file" in item && item instanceof Object && "id" in item && !("file_type" in item);
}

function isMultimediaFromDb(item: MediaItem): item is Multimedia {
  return "file_type" in item && "player_id" in item && !isLegacyMediaItem(item as MediaGalleryItem);
}

type MediaLightboxProps = {
  items: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
};

export function MediaLightbox({
  items,
  initialIndex = 0,
  open,
  onOpenChange,
  onDelete,
}: MediaLightboxProps) {
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, items.length - 1)));
  const safeIndex = useMemo(
    () => Math.min(index, Math.max(0, items.length - 1)),
    [index, items.length]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "ArrowLeft") setIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
      if (e.key === "ArrowRight") setIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, items.length, onOpenChange]);

  if (!open || items.length === 0) return null;

  const item = items[safeIndex];

  const goPrev = () => setIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i >= items.length - 1 ? 0 : i + 1));

  const content = isPendingFile(item) ? (
    item.file.type.startsWith("image/") ? (
      <img
        src={URL.createObjectURL(item.file)}
        alt={item.file.name}
        className="max-h-[80vh] max-w-full rounded-lg object-contain"
      />
    ) : (
      <div className="flex h-64 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        Wideo będzie dostępne po zapisaniu obserwacji.
      </div>
    )
    ) : isLegacyMediaItem(item as MediaGalleryItem) ? (() => {
      const legacy = item as LegacyMediaItem;
      return legacy.file_type === "youtube_link" && legacy.youtube_video_id ? (
        <div className="aspect-video w-full max-w-4xl">
          <iframe
            title={legacy.file_name ?? "YouTube"}
            src={getYoutubeEmbedUrl(legacy.youtube_video_id)}
            className="h-full w-full rounded-lg"
            allowFullScreen
          />
        </div>
      ) : legacy.file_type === "video" ? (
        <video
          src={legacy.url}
          controls
          className="max-h-[80vh] max-w-full rounded-lg"
        />
      ) : (
        <img
          src={legacy.url}
          alt={legacy.file_name ?? "Zdjęcie"}
          className="max-h-[80vh] max-w-full rounded-lg object-contain"
        />
      );
    })() : isMultimediaFromDb(item) && item.file_type === "youtube_link" && item.youtube_video_id ? (
      <div className="aspect-video w-full max-w-4xl">
        <iframe
          title={item.youtube_title ?? "YouTube"}
          src={getYoutubeEmbedUrl(item.youtube_video_id)}
          className="h-full w-full rounded-lg"
          allowFullScreen
        />
      </div>
    ) : isMultimediaFromDb(item) && item.file_type === "video" && item.storage_path ? (
      <video
        src={getMultimediaPublicUrl(item.storage_path)}
        controls
        className="max-h-[80vh] max-w-full rounded-lg"
      />
    ) : isMultimediaFromDb(item) && item.storage_path ? (
      <img
        src={getMultimediaPublicUrl(item.storage_path)}
        alt={item.file_name}
        className="max-h-[80vh] max-w-full rounded-lg object-contain"
      />
    ) : (
      <div className="flex h-64 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        Brak podglądu
      </div>
    );

  const deleteId =
    !isPendingFile(item) && !isLegacyMediaItem(item as MediaGalleryItem) ? (item as MediaGalleryItem).id : null;

  const node = (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black/90">
      <div className="flex items-center justify-between p-2 text-white">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={goPrev}
          aria-label="Poprzedni"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        <span className="text-sm">
          {safeIndex + 1} / {items.length}
        </span>
        <div className="flex gap-1">
          {deleteId && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white hover:bg-red-600"
              onClick={() => {
                onDelete(deleteId);
                if (items.length <= 1) onOpenChange(false);
                else goNext();
              }}
            >
              Usuń
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
            aria-label="Zamknij"
          >
            <X className="h-8 w-8" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-4" onClick={goNext}>
        <div className="cursor-default" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(node, document.body) : null;
}
