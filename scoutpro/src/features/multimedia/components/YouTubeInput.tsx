import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseYouTubeUrl } from "../lib/youtube";
import { getYoutubeThumbnailUrl } from "../api/multimedia.api";

type YouTubeInputProps = {
  onAdd: (params: { url: string; videoId: string; thumbnailUrl: string }) => void;
  onAfterAdd?: () => void;
  disabled?: boolean;
};

export function YouTubeInput({ onAdd, onAfterAdd, disabled }: YouTubeInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);
    const videoId = parseYouTubeUrl(url);
    if (!videoId) {
      setError("Niepoprawny link YouTube. Użyj np. https://www.youtube.com/watch?v=...");
      return;
    }
    const thumbnailUrl = getYoutubeThumbnailUrl(videoId);
    onAdd({ url: url.trim(), videoId, thumbnailUrl });
    setUrl("");
    onAfterAdd?.();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          disabled={disabled}
          className="flex-1"
          aria-label="Link do filmu YouTube"
        />
        <Button type="button" onClick={handleAdd} disabled={disabled || !url.trim()} size="sm">
          Dodaj link
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
