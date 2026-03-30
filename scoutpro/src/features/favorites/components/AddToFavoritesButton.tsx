import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFavoriteLists } from "../hooks/useFavoriteLists";
import { usePlayerFavoriteLists, useInvalidatePlayerFavoriteLists } from "../hooks/usePlayerFavoriteLists";
import { addPlayerToList, removePlayerFromList } from "../api/favorites.api";
import { CreateListDialog } from "./CreateListDialog";
import { useCreateFavoriteList } from "../hooks/useFavoriteLists";
import { toast } from "@/hooks/use-toast";

type AddToFavoritesButtonProps = {
  playerId: string;
  playerName?: string;
  className?: string;
  variant?: "ghost" | "outline" | "link" | "default" | "secondary" | "destructive" | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
  /** Optional label (e.g. "Zarządzaj listami") shown next to icon when size is not icon. */
  label?: string;
  /** If true, show count badge next to icon (default: false; use on player profile) */
  showCount?: boolean;
};

export function AddToFavoritesButton({
  playerId,
  playerName = "Zawodnik",
  className,
  variant = "ghost",
  size = "icon",
  label,
  showCount = false,
}: AddToFavoritesButtonProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: lists = [] } = useFavoriteLists("mine");
  const { data: listIdsContainingPlayer = [] } = usePlayerFavoriteLists(playerId);
  const invalidate = useInvalidatePlayerFavoriteLists();
  const createList = useCreateFavoriteList();

  const count = listIdsContainingPlayer.length;
  const isOnAnyList = count > 0;

  const handleToggleList = async (listId: string, checked: boolean) => {
    try {
      if (checked) {
        await addPlayerToList(listId, playerId);
        toast({ title: `Dodano ${playerName} do listy` });
      } else {
        await removePlayerFromList(listId, playerId);
        toast({ title: `Usunięto ${playerName} z listy` });
      }
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["favorite-list", listId] });
      // Nie invaliduj ["favorite-lists"] tutaj – kolejność list zmieniłaby się natychmiast.
      // Invalidacja przy zamknięciu dropdownu (w onOpenChange).
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się zapisać.",
      });
    }
  };

  const handleCreateAndAdd = async (input: { name: string; description?: string | null; formation?: string; region_id?: string | null }) => {
    try {
      const newList = await createList.mutateAsync(input);
      await addPlayerToList(newList.id, playerId);
      invalidate();
      setCreateOpen(false);
      setOpen(false);
      toast({ title: `Utworzono listę i dodano ${playerName}` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się utworzyć listy.",
      });
    }
  };

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            queryClient.invalidateQueries({ queryKey: ["favorite-lists"] });
          }
          setOpen(nextOpen);
        }}
      >
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
            title={isOnAnyList ? `Na ${count} listach` : "Dodaj do ulubionych"}
          >
            <Heart
              className={`h-4 w-4 ${isOnAnyList ? "fill-red-500 text-red-500" : ""}`}
            />
            {(label || (showCount && count > 0)) && (
              <span className="ml-1 text-xs font-medium">{label ?? count}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white">
          {lists.length === 0 ? (
            <div className="p-2 text-sm text-slate-600">
              <p className="mb-2">Nie masz jeszcze żadnej listy.</p>
              <Button
                type="button"
                size="sm"
                className="w-full gap-1"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCreateOpen(true);
                  setOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Utwórz pierwszą listę
              </Button>
            </div>
          ) : (
            <>
              {lists.map((list) => {
                const onList = listIdsContainingPlayer.includes(list.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={list.id}
                    checked={onList}
                    onCheckedChange={(checked) => handleToggleList(list.id, !!checked)}
                    onSelect={(e) => e.preventDefault()}
                    className="pr-3"
                  >
                    <span className="truncate">{(list as { name?: string }).name ?? list.id}</span>
                  </DropdownMenuCheckboxItem>
                );
              })}
              <div className="border-t border-slate-200 mt-1 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1 text-slate-600"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCreateOpen(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Utwórz nową listę
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateListDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateAndAdd}
        isSubmitting={createList.isPending}
        currentListCount={lists.length}
      />
    </>
  );
}
