const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function parseYouTubeUrl(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(YOUTUBE_REGEX);
  return match ? match[5] ?? null : null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeUrl(url) !== null;
}
