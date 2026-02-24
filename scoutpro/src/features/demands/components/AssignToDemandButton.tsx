import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Target } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerDemands } from "@/features/demands/hooks/usePlayerDemands";
import { usePlayerDemandsForPlayer } from "@/features/demands/hooks/usePlayerDemandsForPlayer";
import { addCandidate } from "@/features/demands/api/candidates.api";
import { formatPosition } from "@/features/players/positions";
import { toast } from "@/hooks/use-toast";

type AssignToDemandButtonProps = {
  playerId: string;
  playerName?: string;
  className?: string;
  variant?: "ghost" | "outline" | "link" | "default" | "secondary" | "destructive" | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
  /** Optional: filter demands by club id */
  clubId?: string | null;
  label?: string;
};

export function AssignToDemandButton({
  playerId,
  playerName = "Zawodnik",
  className,
  variant = "ghost",
  size = "icon",
  clubId = null,
  label,
}: AssignToDemandButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const filters = {
    ...(clubId ? { clubId } : {}),
  };
  const { data: demands = [] } = usePlayerDemands(filters);
  const activeDemands = demands.filter((d) => d.status === "open" || d.status === "in_progress");
  const { data: playerDemands = [] } = usePlayerDemandsForPlayer(playerId);
  const playerDemandIds = new Set(playerDemands.map((d) => d.id));

  const handleSelect = async (demandId: string) => {
    try {
      await addCandidate(demandId, playerId, "manual");
      toast({ title: `Dodano ${playerName} do zapotrzebowania` });
      queryClient.invalidateQueries({ queryKey: ["demand-candidates", demandId] });
      queryClient.invalidateQueries({ queryKey: ["player-demand", demandId] });
      queryClient.invalidateQueries({ queryKey: ["player-demands"] });
      queryClient.invalidateQueries({ queryKey: ["player-demands-for-player", playerId] });
      setOpen(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się przypisać.",
      });
    }
  };

  const filteredDemands = clubId ? activeDemands.filter((d) => d.club_id === clubId) : activeDemands;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          title="Przypisz do zapotrzebowania"
        >
          <Target className="h-4 w-4" />
          {label && <span className="ml-1 text-xs font-medium">{label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 w-72 bg-white">
        {filteredDemands.length === 0 ? (
          <div className="p-2 text-sm text-slate-600">
            Brak aktywnych zapotrzebowań (otwarte lub w trakcie).
          </div>
        ) : (
          filteredDemands.map((d) => {
            const alreadyAssigned = playerDemandIds.has(d.id);
            const title = `${formatPosition(d.position)} · ${d.season}${d.club?.name ? ` (${d.club.name})` : ""}`;
            return (
              <DropdownMenuItem
                key={d.id}
                onSelect={(e) => {
                  e.preventDefault();
                  if (!alreadyAssigned) handleSelect(d.id);
                }}
                disabled={alreadyAssigned}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="truncate w-full text-left">{title}</span>
                {alreadyAssigned && (
                  <span className="text-xs text-slate-500">Już przypisany</span>
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
