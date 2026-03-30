import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useListCollaborators, useAddCollaborator, useRemoveCollaborator } from "../hooks/useListCollaborators";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

type ShareListDialogProps = {
  open: boolean;
  listId: string | null;
  listName: string;
  onClose: () => void;
};

export function ShareListDialog({ open, listId, listName, onClose }: ShareListDialogProps) {
  const [search, setSearch] = useState("");
  const { user } = useAuthStore();
  const { data: collaborators = [] } = useListCollaborators(listId);
  const { data: users = [] } = useUsers();
  const addCollab = useAddCollaborator(listId);
  const removeCollab = useRemoveCollaborator(listId);

  const collaboratorIds = useMemo(() => new Set(collaborators.map((c) => c.user_id)), [collaborators]);
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 20);
    return users
      .filter(
        (u) =>
          u.id !== user?.id &&
          (u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [users, search, user?.id]);

  const handleAdd = async (userId: string) => {
    if (collaboratorIds.has(userId)) return;
    try {
      await addCollab.mutateAsync(userId);
      toast({ title: "Dodano współpracownika" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się dodać.",
      });
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeCollab.mutateAsync(userId);
      toast({ title: "Usunięto współpracownika" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się usunąć.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Udostępnij listę „{listName}”</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Współwłaściciele</p>
            {collaborators.length === 0 ? (
              <p className="text-sm text-slate-500">Brak. Dodaj użytkowników poniżej.</p>
            ) : (
              <ul className="space-y-1">
                {collaborators.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded bg-slate-50 px-2 py-1.5 text-sm"
                  >
                    <span>{(c.user as { full_name?: string; email?: string })?.full_name ?? (c.user as { email?: string })?.email ?? c.user_id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 h-7"
                      onClick={() => handleRemove(c.user_id)}
                      disabled={removeCollab.isPending}
                    >
                      Usuń
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Dodaj użytkownika</p>
            <Input
              placeholder="Szukaj po imieniu lub emailu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <ul className="max-h-48 overflow-y-auto space-y-1 rounded border border-slate-200 p-1">
              {filteredUsers.map((u) => {
                const isCollab = collaboratorIds.has(u.id);
                return (
                  <li key={u.id} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span>{u.full_name?.trim() || u.email || u.id}</span>
                    {isCollab ? (
                      <span className="text-xs text-slate-500">Na liście</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7"
                        onClick={() => handleAdd(u.id)}
                        disabled={addCollab.isPending}
                      >
                        Dodaj
                      </Button>
                    )}
                  </li>
                );
              })}
              {filteredUsers.length === 0 && <li className="text-sm text-slate-500 py-2">Brak użytkowników</li>}
            </ul>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Zamknij</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
