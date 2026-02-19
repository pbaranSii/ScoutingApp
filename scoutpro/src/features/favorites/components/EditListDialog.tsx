import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegions } from "@/features/dictionaries/hooks/useDictionaries";
import { FORMATION_OPTIONS } from "../types";
import type { FavoriteList, FormationCode } from "../types";

type EditListDialogProps = {
  open: boolean;
  list: FavoriteList | null;
  onClose: () => void;
  onSubmit: (input: { name?: string; description?: string | null; formation?: string; region_id?: string | null }) => Promise<void>;
  isSubmitting: boolean;
};

export function EditListDialog({ open, list, onClose, onSubmit, isSubmitting }: EditListDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formation, setFormation] = useState<FormationCode>("4-4-2");
  const [regionId, setRegionId] = useState<string>("");
  const { data: regions = [] } = useRegions();

  useEffect(() => {
    if (list) {
      setName(list.name);
      setDescription(list.description ?? "");
      setFormation((list.formation as FormationCode) || "4-4-2");
      setRegionId(list.region_id ?? "");
    }
  }, [list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      formation,
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
              <Label>Formacja</Label>
              <Select value={formation} onValueChange={(v) => setFormation(v as FormationCode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
