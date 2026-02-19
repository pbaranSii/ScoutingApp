import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegions } from "@/features/dictionaries/hooks/useDictionaries";
import { FORMATION_OPTIONS, MAX_FAVORITE_LISTS_PER_USER } from "../types";
import type { FormationCode } from "../types";

type CreateListDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; description?: string | null; formation?: string; region_id?: string | null }) => Promise<void>;
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
  const [formation, setFormation] = useState<FormationCode>("4-4-2");
  const [regionId, setRegionId] = useState<string>("");
  const { data: regions = [] } = useRegions();

  const canCreate = currentListCount < MAX_FAVORITE_LISTS_PER_USER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    await onSubmit({
      name: trimmedName,
      description: description.trim() || null,
      formation,
      region_id: regionId || null,
    });
    setName("");
    setDescription("");
    setFormation("4-4-2");
    setRegionId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Utwórz nową listę</DialogTitle>
          <DialogDescription className="sr-only">
            Formularz tworzenia nowej listy ulubionych zawodników. Podaj nazwę, opcjonalnie opis i formację.
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
              <Label htmlFor="list-desc">Opis (opcjonalnie)</Label>
              <Input
                id="list-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis listy"
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
              <Label>Udostępnij regionowi (opcjonalnie)</Label>
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
                {isSubmitting ? "Zapisywanie…" : "Utwórz listę"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
