import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Plus } from "lucide-react";
import { useFavoriteLists, useCreateFavoriteList, useUpdateFavoriteList, useDeleteFavoriteList } from "@/features/favorites/hooks";
import type { FavoriteListFilter } from "@/features/favorites/api/favorites.api";
import type { FavoriteList } from "@/features/favorites/types";
import { FavoriteListCard } from "@/features/favorites/components/FavoriteListCard";
import { CreateListDialog } from "@/features/favorites/components/CreateListDialog";
import { EditListDialog } from "@/features/favorites/components/EditListDialog";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { toast } from "@/hooks/use-toast";

export function FavoriteListsPage() {
  const [filter, setFilter] = useState<FavoriteListFilter>("mine");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<FavoriteList | null>(null);
  const { user } = useAuthStore();
  const { data: profile } = useCurrentUserProfile();
  const isAdmin = profile?.role === "admin";

  const { data: lists = [], isLoading, isError, error } = useFavoriteLists(filter);
  const createList = useCreateFavoriteList();
  const updateList = useUpdateFavoriteList();
  const deleteList = useDeleteFavoriteList();

  const canCreate = (filter === "mine" ? lists.length : 0) < 20;

  const handleCreate = async (input: Parameters<typeof createList.mutateAsync>[0]) => {
    try {
      await createList.mutateAsync(input);
      toast({ title: "Lista utworzona" });
      setCreateOpen(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się utworzyć listy.",
      });
    }
  };

  const handleUpdate = async (input: Parameters<typeof updateList.mutateAsync>[0]["input"]) => {
    if (!editingList) return;
    try {
      await updateList.mutateAsync({ id: editingList.id, input });
      toast({ title: "Lista zaktualizowana" });
      setEditingList(null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się zapisać.",
      });
    }
  };

  const handleDelete = async (list: FavoriteList) => {
    try {
      await deleteList.mutateAsync(list.id);
      toast({ title: "Lista usunięta" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się usunąć listy.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ulubione"
        subtitle="Twoje listy zawodników i shortlisty"
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={!canCreate}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Utwórz nową listę
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Pokaż:</span>
        <Button
          variant={filter === "mine" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("mine")}
        >
          Moje listy
        </Button>
        <Button
          variant={filter === "shared" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("shared")}
        >
          Udostępnione mi
        </Button>
        {isAdmin && (
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Wszystkie
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Ładowanie list…</p>}
      {isError && (
        <p className="text-sm text-red-600">
          Błąd: {error instanceof Error ? error.message : "Nie udało się załadować list."}
        </p>
      )}
      {!isLoading && !isError && lists.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">
          <p className="font-medium">Brak list.</p>
          <p className="mt-1 text-sm">Utwórz pierwszą listę, aby dodawać do niej zawodników.</p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => setCreateOpen(true)}
            disabled={!canCreate}
          >
            Utwórz listę
          </Button>
        </div>
      )}
      {!isLoading && !isError && lists.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <FavoriteListCard
              key={list.id}
              list={list}
              isOwner={user?.id === list.owner_id}
              onEdit={setEditingList}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateListDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createList.isPending}
        currentListCount={filter === "mine" ? lists.length : 0}
      />
      <EditListDialog
        open={Boolean(editingList)}
        list={editingList}
        onClose={() => setEditingList(null)}
        onSubmit={handleUpdate}
        isSubmitting={updateList.isPending}
      />
    </div>
  );
}
