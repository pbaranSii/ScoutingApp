import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { YouTubeInput } from "./YouTubeInput";
import { Camera, ImagePlus, Link2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
} from "../types";

const ACCEPT_IMAGE_VIDEO = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
].join(",");
const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const VIDEO_EXTENSIONS = ["mp4", "mov"];

function getFileKind(file: File): "image" | "video" | null {
  const mime = file.type?.toLowerCase() ?? "";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ALLOWED_IMAGE_TYPES.includes(mime) || IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mime) || VIDEO_EXTENSIONS.includes(ext)) return "video";
  return null;
}

export type ObservationOption = { value: string; label: string };

type MediaUploadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: File[]) => void;
  onYoutubeAdd: (params: {
    url: string;
    videoId: string;
    thumbnailUrl: string;
  }) => void;
  maxFiles?: number;
  currentCount?: number;
  title?: string;
  /** When set, show dropdown to link media to an observation (e.g. on player profile). */
  observationOptions?: ObservationOption[];
  selectedObservationId?: string | null;
  onObservationIdChange?: (id: string | null) => void;
};

export function MediaUploadModal({
  open,
  onOpenChange,
  onFilesSelected,
  onYoutubeAdd,
  maxFiles = 20,
  currentCount = 0,
  title = "Dodaj multimedia",
  observationOptions,
  selectedObservationId = null,
  onObservationIdChange,
}: MediaUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, maxFiles - currentCount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    const files = rawFiles ? Array.from(rawFiles) : [];
    e.target.value = "";

    if (files.length === 0) return;

    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const kind = getFileKind(file);
      if (!kind) {
        errors.push(
          `Format pliku nie jest wspierany (${file.name}). Obsługiwane: JPG, PNG, MP4, MOV.`
        );
        continue;
      }
      const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      const maxMb = kind === "image" ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB;
      if (file.size > maxBytes) {
        errors.push(
          `Plik "${file.name}" jest zbyt duży (limit: ${maxMb} MB).`
        );
        continue;
      }
      valid.push(file);
    }

    if (errors.length > 0) {
      const msg = errors.slice(0, 3).join(" ");
      alert(msg);
    }
    if (valid.length > 0) {
      const toAdd = valid.slice(0, remaining);
      onFilesSelected(toAdd);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-upload-title"
    >
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        className="relative z-[101] w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="media-upload-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          {remaining > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Zdjęcia (JPG, PNG, max {MAX_IMAGE_SIZE_MB} MB), wideo (MP4, MOV, max{" "}
                  {MAX_VIDEO_SIZE_MB} MB). Pozostało miejsc: {remaining}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_IMAGE_VIDEO}
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Wybierz pliki"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Wybierz z galerii
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Zdjęcie / wideo
                  </Button>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Link2 className="h-4 w-4" />
                  Link YouTube
                </p>
                <YouTubeInput
                  onAdd={onYoutubeAdd}
                  onAfterAdd={() => onOpenChange(false)}
                />
              </div>
              {observationOptions && onObservationIdChange && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Powiąż z obserwacją (opcjonalnie)
                  </p>
                  <Select
                    value={selectedObservationId ?? "none"}
                    onValueChange={(v) => onObservationIdChange(v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bez obserwacji" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Bez obserwacji</SelectItem>
                      {observationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
          {remaining <= 0 && (
            <p className="text-sm text-slate-600">
              Osiągnięto limit multimediów ({maxFiles}). Usuń część, aby dodać nowe.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
