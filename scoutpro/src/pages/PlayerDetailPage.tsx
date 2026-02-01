import { useParams } from "react-router-dom";
import { usePlayer } from "@/features/players/hooks/usePlayers";
import { PlayerProfile } from "@/features/players/components/PlayerProfile";

export function PlayerDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = usePlayer(id ?? "");

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Nie znaleziono zawodnika.</p>;
  }

  return <PlayerProfile player={data} />;
}
