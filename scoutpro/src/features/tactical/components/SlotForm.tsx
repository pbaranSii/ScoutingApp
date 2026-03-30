import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EditableSlot, SlotDepth, SlotSide } from "../types";
import type { PositionDictionaryRow } from "../types";

const SIDES: SlotSide[] = ["L", "C", "R"];
const DEPTHS: SlotDepth[] = ["GK", "DEF", "MID", "ATT"];

type SlotFormProps = {
  slot: EditableSlot | null;
  positions: PositionDictionaryRow[];
  onSubmit: (slot: Omit<EditableSlot, "position_code" | "position_number">) => void;
  onCancel: () => void;
  onRemove?: () => void;
};

export function SlotForm({
  slot,
  positions,
  onSubmit,
  onCancel,
  onRemove,
}: SlotFormProps) {
  const [position_id, setPositionId] = useState(slot?.position_id ?? "");
  const [slot_label, setSlotLabel] = useState(slot?.slot_label ?? "");
  const [side, setSide] = useState<SlotSide>(slot?.side ?? "C");
  const [depth, setDepth] = useState<SlotDepth>(slot?.depth ?? "MID");
  const [x, setX] = useState(slot?.x ?? 50);
  const [y, setY] = useState(slot?.y ?? 50);
  const [role_hint, setRoleHint] = useState(slot?.role_hint ?? "");
  const [is_required, setIsRequired] = useState(slot?.is_required ?? true);
  const [display_order, setDisplayOrder] = useState(slot?.display_order ?? 0);

  useEffect(() => {
    if (slot) {
      setPositionId(slot.position_id);
      setSlotLabel(slot.slot_label ?? "");
      setSide(slot.side);
      setDepth(slot.depth);
      setX(slot.x);
      setY(slot.y);
      setRoleHint(slot.role_hint ?? "");
      setIsRequired(slot.is_required);
      setDisplayOrder(slot.display_order);
    }
  }, [slot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: slot?.id,
      position_id,
      slot_label: slot_label.trim() || null,
      x: Math.max(0, Math.min(100, Number(x))),
      y: Math.max(0, Math.min(100, Number(y))),
      side,
      depth,
      is_required,
      role_hint: role_hint.trim() || null,
      display_order: Number(display_order) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Pozycja ze słownika</Label>
        <Select value={position_id || "_"} onValueChange={(v) => setPositionId(v === "_" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wybierz pozycję" />
          </SelectTrigger>
          <SelectContent>
            {positions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.position_number} – {p.position_code} – {p.position_name_pl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="slot_label">Etykieta slotu</Label>
        <Input
          id="slot_label"
          value={slot_label}
          onChange={(e) => setSlotLabel(e.target.value)}
          placeholder="np. 8L, 8R"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Strona</Label>
          <Select value={side} onValueChange={(v) => setSide(v as SlotSide)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIDES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Linia</Label>
          <Select value={depth} onValueChange={(v) => setDepth(v as SlotDepth)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPTHS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="slot_x">X (0–100)</Label>
          <Input
            id="slot_x"
            type="number"
            min={0}
            max={100}
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="slot_y">Y (0–100)</Label>
          <Input
            id="slot_y"
            type="number"
            min={0}
            max={100}
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="role_hint">Rola funkcjonalna</Label>
        <Input
          id="role_hint"
          value={role_hint}
          onChange={(e) => setRoleHint(e.target.value)}
          placeholder="np. playmaker, box-to-box"
        />
      </div>
      <div>
        <Label htmlFor="display_order">Kolejność</Label>
        <Input
          id="display_order"
          type="number"
          min={0}
          value={display_order}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={is_required}
          onChange={(e) => setIsRequired(e.target.checked)}
        />
        <span className="text-sm">Slot wymagany</span>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        {onRemove && (
          <Button type="button" variant="outline" className="text-red-600" onClick={onRemove}>
            Usuń slot
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" disabled={!position_id}>
          Zapisz
        </Button>
      </div>
    </form>
  );
}
