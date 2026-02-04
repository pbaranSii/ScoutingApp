import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { Player } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PIPELINE_COLUMNS } from "@/features/pipeline/types";
import { formatPosition } from "@/features/players/positions";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useDeletePlayer } from "@/features/players/hooks/usePlayers";
import { useDeleteObservationsByPlayer } from "@/features/observations/hooks/useObservations";
import { toast } from "@/hooks/use-toast";

type PlayerProfileProps = {
  player: Player;
};

export function PlayerProfile({ player }: PlayerProfileProps) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletePlayer = useDeletePlayer();
  const deleteObservations = useDeleteObservationsByPlayer();
  const canUseDom = typeof document !== "undefined";
  const statusLabel =
    PIPELINE_COLUMNS.find((column) => column.id === (player.pipeline_status ?? "observed"))
      ?.label ?? "Obserwowany";
  const initials = `${player.first_name?.[0] ?? ""}${player.last_name?.[0] ?? ""}`.toUpperCase();
  const footLabel =
    player.dominant_foot === "left"
      ? "Left"
      : player.dominant_foot === "right"
        ? "Right"
        : player.dominant_foot === "both"
          ? "Both"
          : "Brak";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <Link to="/players" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrot do listy
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-lg font-semibold text-white">
            {initials || "?"}
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-slate-900">
              {player.first_name} {player.last_name}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {player.primary_position && (
                <Badge className="rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                  {formatPosition(player.primary_position)}
                </Badge>
              )}
              <Badge className="rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                {player.birth_year}
              </Badge>
              <Badge className="rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                {player.club?.name ?? "Brak klubu"}
              </Badge>
            </div>
            <Badge className="w-fit rounded-full bg-blue-100 px-2 text-xs text-blue-700 hover:bg-blue-100">
              {statusLabel}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-2 bg-red-600 hover:bg-red-700">
            <Link to={`/players/${player.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edytuj profil
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => {
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Usuń
          </Button>
        </div>
      </div>

      {canUseDom &&
        isDeleteOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteOpen(false);
              }}
            />
            <div
              className="relative z-[81] w-[min(520px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">Usun zawodnika?</h2>
                <p className="text-sm text-slate-600">
                  Ta operacja jest nieodwracalna. Wraz z zawodnikiem zostana usuniete jego obserwacje.
                </p>
              </div>
              {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteError(null);
                    setIsDeleteOpen(false);
                  }}
                  disabled={deletePlayer.isPending || deleteObservations.isPending}
                >
                  Anuluj
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setDeleteError(null);
                    try {
                      await deleteObservations.mutateAsync(player.id);
                      await deletePlayer.mutateAsync(player.id);
                      toast({
                        title: "Usunieto zawodnika",
                        description: "Zawodnik i jego obserwacje zostaly trwale usuniete.",
                      });
                      setIsDeleteOpen(false);
                      navigate("/players");
                    } catch (error) {
                      const rawMessage =
                        error instanceof Error && error.message ? error.message : "";
                      const isForeignKeyIssue =
                        rawMessage.includes("foreign key") || rawMessage.includes("observations");
                      const message = isForeignKeyIssue
                        ? "Nie mozna usunac zawodnika z powodu powiazanych obserwacji."
                        : rawMessage || "Nie udalo sie usunac zawodnika";
                      setDeleteError(message);
                      toast({
                        variant: "destructive",
                        title: "Nie udalo sie usunac",
                        description: message,
                      });
                      console.error("Delete player failed:", error);
                    }
                  }}
                  disabled={deletePlayer.isPending || deleteObservations.isPending}
                >
                  Usuń
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs text-slate-500">Wzrost</div>
            <div className="text-lg font-semibold text-slate-900">
              {player.height_cm ? `${player.height_cm} cm` : "Brak"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs text-slate-500">Waga</div>
            <div className="text-lg font-semibold text-slate-900">
              {player.weight_kg ? `${player.weight_kg} kg` : "Brak"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs text-slate-500">Preferowana noga</div>
            <div className="text-lg font-semibold text-slate-900">{footLabel}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs text-slate-500">Narodowosc</div>
            <div className="text-lg font-semibold text-slate-900">
              {player.nationality ?? "Brak"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
