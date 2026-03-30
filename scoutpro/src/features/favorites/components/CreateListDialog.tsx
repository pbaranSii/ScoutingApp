import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormationSelector, type FormationSelection } from "@/features/favorites/components/FormationSelector";
import { useDefaultFormation } from "@/features/tactical/hooks/useFormations";
import { MAX_FAVORITE_LISTS_PER_USER } from "../types";

type CreateListDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    description?: string | null;
    formation?: string;
    formation_id?: string | null;
  }) => Promise<void>;
  isSubmitting: boolean;
  currentListCount: number;
};

export function CreateListDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  currentListCount,
}: CreateListDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formationSelection, setFormationSelection] = useState<FormationSelection>({
    formation_id: null,
    formation: "4-4-2",
  });
  const { data: defaultFormation } = useDefaultFormation();

  useEffect(() => {
    if (open && defaultFormation && !formationSelection.formation_id) {
      setFormationSelection({ formation_id: defaultFormation.id, formation: defaultFormation.code });
    }
  }, [open, defaultFormation]);

  const canCreate = currentListCount < MAX_FAVORITE_LISTS_PER_USER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    await onSubmit({
      name: trimmedName,
      description: description.trim() || null,
      formation: formationSelection.formation,
      formation_id: formationSelection.formation_id,
    });
    setName("");
    setDescription("");
    setFormationSelection({ formation_id: null, formation: "4-4-2" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Utwórz nową listę</DialogTitle>
          <DialogDescription className="sr-only">
            Formularz tworzenia nowej listy ulubionych zawodników. Podaj nazwę, opcjonalnie opis i schemat taktyczny.
          </DialogDescription>
        </DialogHeader>
        {!canCreate ? (
          <p className="text-sm text-amber-600">
            Osiągnięto limit {MAX_FAVORITE_LISTS_PER_USER} list. Usuń jedną z list, aby dodać nową.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="list-name">Nazwa listy *</Label>
              <Input
                id="list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. U15 Shortlist 2026"
                maxLength={100}
                required
              />
            </div>
            <div>
              <Label htmlFor="list-desc">Opis</Label>
              <Input
                id="list-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis listy"
                maxLength={500}
              />
            </div>
            <div>
              <Label>Schemat taktyczny</Label>
              <FormationSelector value={formationSelection} onChange={setFormationSelection} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={!name.trim() || isSubmitting}>
                {isSubmitting ? "Zapisywanie…" : "Utwórz listę"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
