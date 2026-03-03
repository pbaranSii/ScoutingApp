import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegions } from "@/features/dictionaries/hooks/useDictionaries";
import { FormationSelector, type FormationSelection } from "@/features/favorites/components/FormationSelector";
import { useDefaultFormation } from "@/features/tactical/hooks/useFormations";
import type { FavoriteList } from "../types";

type EditListDialogProps = {
  open: boolean;
  list: FavoriteList | null;
  onClose: () => void;
  onSubmit: (input: {
    name?: string;
    description?: string | null;
    formation?: string;
    formation_id?: string | null;
    region_id?: string | null;
  }) => Promise<void>;
  isSubmitting: boolean;
};

export function EditListDialog({ open, list, onClose, onSubmit, isSubmitting }: EditListDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formationSelection, setFormationSelection] = useState<FormationSelection>({
    formation_id: null,
    formation: "4-4-2",
  });
  const [regionId, setRegionId] = useState<string>("");
  const { data: regions = [] } = useRegions();
  const { data: defaultFormation } = useDefaultFormation();

  useEffect(() => {
    if (list) {
      setName(list.name);
      setDescription(list.description ?? "");
      const hasFormationId = list.formation_id != null && list.formation_id !== "";
      if (hasFormationId) {
        setFormationSelection({
          formation_id: list.formation_id ?? null,
          formation: list.formation || "4-4-2",
        });
      } else if (defaultFormation) {
        setFormationSelection({
          formation_id: defaultFormation.id,
          formation: defaultFormation.code,
        });
      } else {
        setFormationSelection({
          formation_id: null,
          formation: list.formation || "4-4-2",
        });
      }
      setRegionId(list.region_id ?? "");
    }
  }, [list, defaultFormation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      formation: formationSelection.formation,
      formation_id: formationSelection.formation_id,
      region_id: regionId || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj listę</DialogTitle>
        </DialogHeader>
        {list && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-list-name">Nazwa listy *</Label>
              <Input
                id="edit-list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-list-desc">Opis (opcjonalnie)</Label>
              <Input
                id="edit-list-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            <div>
              <Label>Schemat taktyczny</Label>
              <FormationSelector value={formationSelection} onChange={setFormationSelection} />
            </div>
            <div>
              <Label>Udostępnij regionowi</Label>
              <Select value={regionId || "none"} onValueChange={(v) => setRegionId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz województwo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nie udostępniaj —</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {(r as { name?: string }).name ?? r.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={!name.trim() || isSubmitting}>
                {isSubmitting ? "Zapisywanie…" : "Zapisz"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
