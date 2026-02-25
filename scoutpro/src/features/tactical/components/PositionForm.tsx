import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PositionDictionaryRow } from "../types";

export type PositionFormValues = {
  position_number: number;
  position_code: string;
  position_name_pl: string;
  description: string;
  display_order: number;
};

type PositionFormProps = {
  initial?: PositionDictionaryRow | null;
  onSubmit: (values: PositionFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function PositionForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: PositionFormProps) {
  const [position_number, setPositionNumber] = useState(
    initial?.position_number ?? 1
  );
  const [position_code, setPositionCode] = useState(
    (initial?.position_code ?? "").trim()
  );
  const [position_name_pl, setPositionNamePl] = useState(
    (initial?.position_name_pl ?? "").trim()
  );
  const [description, setDescription] = useState(
    (initial?.description ?? "").trim()
  );
  const [display_order, setDisplayOrder] = useState(
    initial?.display_order ?? 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      position_number: Number(position_number),
      position_code: position_code.trim(),
      position_name_pl: position_name_pl.trim(),
      description: description.trim() || "",
      display_order: Number(display_order) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="position_number">Numer pozycji (0–11)</Label>
        <Input
          id="position_number"
          type="number"
          min={0}
          max={11}
          value={position_number}
          onChange={(e) => setPositionNumber(Number(e.target.value) || 0)}
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          0 = slot zmienny (WB, SW, SS)
        </p>
      </div>
      <div>
        <Label htmlFor="position_code">Kod (2–4 znaki)</Label>
        <Input
          id="position_code"
          value={position_code}
          onChange={(e) => setPositionCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="np. GK, CB"
          maxLength={4}
          required
        />
      </div>
      <div>
        <Label htmlFor="position_name_pl">Nazwa (PL)</Label>
        <Input
          id="position_name_pl"
          value={position_name_pl}
          onChange={(e) => setPositionNamePl(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Opis (opcjonalnie)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="display_order">Kolejność wyświetlania</Label>
        <Input
          id="display_order"
          type="number"
          min={0}
          value={display_order}
          onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie…" : initial ? "Zapisz" : "Dodaj"}
        </Button>
      </div>
    </form>
  );
}
