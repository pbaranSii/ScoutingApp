import { useState } from "react";
import { createPortal } from "react-dom";
import { Film, Image as ImageIcon, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMultimediaPublicUrl, getYoutubeThumbnailUrl } from "../api/multimedia.api";
import type { Multimedia } from "../types";
import { cn } from "@/lib/utils";

type PendingFile = { file: File; id: string };
type PendingYoutube = { url: string; videoId: string; thumbnailUrl: string };

type MediaPreviewProps = {
  pendingFiles?: PendingFile[];
  pendingYoutube?: PendingYoutube[];
  savedMedia?: Multimedia[];
  onRemovePending?: (id: string) => void;
  onRemoveYoutube?: (index: number) => void;
  onRemoveSaved?: (id: string) => void;
  onPreview?: (item: Multimedia | PendingFile) => void;
  className?: string;
};

function Thumbnail({
  type,
  src,
  alt,
  className,
}: {
  type: "image" | "video" | "youtube_link";
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 sm:h-24 sm:w-24",
          className
        )}
      >
        {type === "youtube_link" ? (
          <Link2 className="h-8 w-8 text-slate-400" />
        ) : type === "video" ? (
          <Film className="h-8 w-8 text-slate-400" />
        ) : (
          <ImageIcon className="h-8 w-8 text-slate-400" />
        )}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24", className)}
      referrerPolicy={type === "youtube_link" ? "no-referrer" : undefined}
      loading="lazy"
    />
  );
}

export function MediaPreview({
  pendingFiles = [],
  pendingYoutube = [],
  savedMedia = [],
  onRemovePending,
  onRemoveYoutube,
  onRemoveSaved,
  onPreview,
  className,
}: MediaPreviewProps) {
  const [confirmRemove, setConfirmRemove] = useState<{
    type: "pending" | "youtube" | "saved";
    id: string;
    index?: number;
  } | null>(null);

  const handleConfirmRemove = (
    type: "pending" | "youtube" | "saved",
    id: string,
    index?: number
  ) => {
    setConfirmRemove({ type, id, index });
  };

  const executeRemove = () => {
    if (!confirmRemove) return;
    if (confirmRemove.type === "pending") onRemovePending?.(confirmRemove.id);
    else if (confirmRemove.type === "youtube" && confirmRemove.index !== undefined)
      onRemoveYoutube?.(confirmRemove.index);
    else onRemoveSaved?.(confirmRemove.id);
    setConfirmRemove(null);
  };

  const canUseDom = typeof document !== "undefined";
  const total = pendingFiles.length + pendingYoutube.length + savedMedia.length;
  if (total === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-slate-700">
        Dodane multimedia ({total})
      </p>
      <div className="flex flex-wrap gap-3">
        {pendingFiles.map(({ file, id }) => {
          const isImage = file.type.startsWith("image/");
          const src = isImage ? URL.createObjectURL(file) : null;
          return (
            <div
              key={id}
              className="relative group rounded-lg border border-slate-200 bg-slate-50 p-1"
            >
              <Thumbnail
                type={isImage ? "image" : "video"}
                src={src ?? null}
                alt={file.name}
              />
              <div className="absolute right-1 top-1 flex gap-1">
                {onPreview && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 opacity-90"
                    onClick={() => onPreview({ file, id })}
                    aria-label="Podgląd"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 opacity-90"
                  onClick={() => handleConfirmRemove("pending", id)}
                  aria-label="Usuń"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-1 max-w-[100px] truncate text-xs text-slate-500">
                {file.name}
              </p>
            </div>
          );
        })}
        {pendingYoutube.map((y, idx) => (
            <div
              key={`yt-${idx}`}
              className="relative group rounded-lg border border-slate-200 bg-slate-50 p-1"
            >
              <Thumbnail type="youtube_link" src={y.thumbnailUrl} alt="YouTube" />
              <div className="absolute right-1 top-1">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 opacity-90"
                  onClick={() => handleConfirmRemove("youtube", `yt-${idx}`, idx)}
                  aria-label="Usuń"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-1 max-w-[100px] truncate text-xs text-slate-500">YouTube</p>
            </div>
          ))}
        {savedMedia.map((m) => {
          const thumbSrc =
            m.file_type === "youtube_link" && m.youtube_video_id
              ? getYoutubeThumbnailUrl(m.youtube_video_id)
              : m.storage_path
                ? getMultimediaPublicUrl(m.storage_path)
                : null;
          return (
            <div
              key={m.id}
              className="relative group rounded-lg border border-slate-200 bg-slate-50 p-1"
            >
              <button
                type="button"
                className="block text-left"
                onClick={() => onPreview?.(m)}
                aria-label="Podgląd"
              >
                <Thumbnail
                  type={m.file_type}
                  src={thumbSrc}
                  alt={m.file_name}
                />
              </button>
              <div className="absolute right-1 top-1">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 opacity-90"
                  onClick={() => handleConfirmRemove("saved", m.id, undefined)}
                  aria-label="Usuń"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-1 max-w-[100px] truncate text-xs text-slate-500">
                {m.file_type === "youtube_link" ? "YouTube" : m.file_name}
              </p>
            </div>
          );
        })}
      </div>

      {canUseDom &&
        confirmRemove &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmRemove(null)}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(360px,92vw)] rounded-lg bg-white p-5 shadow-xl"
              role="dialog"
              aria-labelledby="confirm-remove-title"
            >
              <h2 id="confirm-remove-title" className="text-lg font-semibold text-slate-900">
                Potwierdź usunięcie
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Czy na pewno chcesz usunąć ten plik? Tej operacji nie można cofnąć.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmRemove(null)}>
                  Anuluj
                </Button>
                <Button variant="destructive" onClick={executeRemove}>
                  Usuń
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
