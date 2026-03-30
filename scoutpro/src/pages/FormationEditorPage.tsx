import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormationById, useCreateFormation, useUpdateFormation, useReplaceFormationSlots } from "@/features/tactical/hooks/useFormations";
import { usePositionDictionary } from "@/features/tactical/hooks/usePositionDictionary";
import { PitchView } from "@/features/tactical/components/PitchView";
import { SlotForm } from "@/features/tactical/components/SlotForm";
import type { EditableSlot } from "@/features/tactical/types";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const GK_POSITION_NUMBER = 1;

function toEditableSlots(
  slots: { id: string; position_id: string; slot_label: string | null; x: number; y: number; side: string; depth: string; is_required: boolean; role_hint: string | null; display_order: number; position_dictionary?: { position_code: string; position_number: number } | null }[]
): EditableSlot[] {
  return slots.map((s) => ({
    id: s.id,
    position_id: s.position_id,
    slot_label: s.slot_label,
    x: s.x,
    y: s.y,
    side: s.side as EditableSlot["side"],
    depth: s.depth as EditableSlot["depth"],
    is_required: s.is_required,
    role_hint: s.role_hint,
    display_order: s.display_order,
    position_code: s.position_dictionary?.position_code,
    position_number: s.position_dictionary?.position_number,
  }));
}

function validateSlots(slots: EditableSlot[], positions: { id: string; position_number: number }[]): string | null {
  if (slots.length !== 11) return "Schemat musi zawierać dokładnie 11 slotów.";
  const gkCount = slots.filter((s) => {
    const pos = positions.find((p) => p.id === s.position_id);
    return pos?.position_number === GK_POSITION_NUMBER;
  }).length;
  if (gkCount !== 1) return "Dokładnie jeden slot musi mieć pozycję Bramkarz (1 – GK).";
  const ids = new Set(slots.map((s) => s.id).filter(Boolean));
  if (slots.filter((s) => s.id).length !== ids.size) return "Duplikaty ID slotów.";
  for (const s of slots) {
    if (s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100) return "Współrzędne X, Y muszą być w zakresie 0–100.";
    if (!s.position_id) return "Każdy slot musi mieć przypisaną pozycję.";
  }
  return null;
}

export function FormationEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data: formation, isLoading: loadingFormation } = useFormationById(isNew ? null : id ?? null);
  const { data: positions = [] } = usePositionDictionary(false);
  const createFormation = useCreateFormation();
  const updateFormation = useUpdateFormation();
  const replaceSlots = useReplaceFormationSlots();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [is_default, setIsDefault] = useState(false);
  const [slots, setSlots] = useState<EditableSlot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [slotModalOpen, setSlotModalOpen] = useState(false);

  // Hydrate from loaded formation
  useEffect(() => {
    if (formation) {
      setName(formation.name);
      setCode(formation.code);
      setDescription(formation.description ?? "");
      setIsDefault(formation.is_default);
      setSlots(toEditableSlots(formation.tactical_slots ?? []));
    }
  }, [formation?.id]);

  const selectedSlot = selectedSlotIndex !== null ? slots[selectedSlotIndex] ?? null : null;
  const readOnly = false;

  const validationError = useMemo(
    () => (slots.length > 0 ? validateSlots(slots, positions) : null),
    [slots, positions]
  );

  const handleAddSlot = (x: number, y: number) => {
    if (slots.length >= 11) {
      toast({ variant: "destructive", title: "Maksymalnie 11 slotów." });
      return;
    }
    const firstPos = positions[0];
    const newSlot: EditableSlot = {
      position_id: firstPos?.id ?? "",
      slot_label: null,
      x,
      y,
      side: "C",
      depth: "MID",
      is_required: true,
      role_hint: null,
      display_order: slots.length,
      position_code: firstPos?.position_code,
      position_number: firstPos?.position_number,
    };
    setSlots((prev) => [...prev, newSlot]);
    setSelectedSlotIndex(slots.length);
    setSlotModalOpen(true);
  };

  const handleSaveSlot = (updated: Omit<EditableSlot, "position_code" | "position_number">) => {
    const pos = positions.find((p) => p.id === updated.position_id);
    const withDisplay: EditableSlot = {
      ...updated,
      position_code: pos?.position_code,
      position_number: pos?.position_number,
    };
    if (selectedSlotIndex !== null) {
      setSlots((prev) =>
        prev.map((s, i) => (i === selectedSlotIndex ? withDisplay : s))
      );
    } else {
      setSlots((prev) => [...prev, withDisplay]);
    }
    setSlotModalOpen(false);
    setSelectedSlotIndex(null);
  };

  const handleRemoveSlot = () => {
    if (selectedSlotIndex === null) return;
    setSlots((prev) => prev.filter((_, i) => i !== selectedSlotIndex));
    setSelectedSlotIndex(null);
    setSlotModalOpen(false);
  };

  const handleSave = async () => {
    const err = validateSlots(slots, positions);
    if (err) {
      toast({ variant: "destructive", title: "Walidacja", description: err });
      return;
    }
    const slotPayload = slots.map((s) => ({
      position_id: s.position_id,
      slot_label: s.slot_label,
      x: s.x,
      y: s.y,
      side: s.side,
      depth: s.depth,
      is_required: s.is_required,
      role_hint: s.role_hint,
      display_order: s.display_order,
    }));

    if (isNew) {
      try {
        await createFormation.mutateAsync({
          input: { name, code, description, is_default, is_system: false },
          slots: slotPayload,
        });
        toast({ title: "Utworzono schemat" });
        navigate("/settings/tactical/formations", { replace: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Błąd zapisu";
        toast({ variant: "destructive", title: "Błąd", description: msg });
      }
    } else if (id) {
      try {
        await updateFormation.mutateAsync({ id, input: { name, code, description, is_default } });
        await replaceSlots.mutateAsync({ formationId: id, slots: slotPayload });
        toast({ title: "Zapisano schemat" });
        navigate("/settings/tactical/formations", { replace: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Błąd zapisu";
        toast({ variant: "destructive", title: "Błąd", description: msg });
      }
    }
  };

  if (!isNew && id && loadingFormation) {
    return <p className="p-4 text-sm text-slate-500">Ładowanie schematu…</p>;
  }
  if (!isNew && id && !formation) {
    return (
      <div className="p-4">
        <p className="text-slate-600">Nie znaleziono schematu.</p>
        <Button variant="outline" asChild>
          <Link to="/settings/tactical/formations">Wróć do listy</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link to="/settings/tactical/formations" className="inline-flex items-center gap-1 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót
        </Link>
      </div>
      <PageHeader
        title={isNew ? "Nowy schemat taktyczny" : formation?.name ?? "Edytuj schemat"}
        subtitle={isNew ? "Wypełnij dane i dodaj 11 slotów na boisku." : "Sloty: 11, dokładnie jeden GK."}
        actions={
          !readOnly && (
            <Button
              onClick={handleSave}
              disabled={
                createFormation.isPending ||
                updateFormation.isPending ||
                replaceSlots.isPending ||
                !!validationError ||
                slots.length !== 11
              }
            >
              {createFormation.isPending || updateFormation.isPending || replaceSlots.isPending
                ? "Zapisywanie…"
                : "Zapisz"}
            </Button>
          )
        }
      />
      {validationError && (
        <p className="rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">{validationError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <PitchView
          slots={slots}
          selectedSlotIndex={selectedSlotIndex}
          onSelectSlot={(i) => {
            setSelectedSlotIndex(i);
            setSlotModalOpen(true);
          }}
          onDrop={readOnly ? undefined : handleAddSlot}
          readOnly={readOnly}
        />
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="font-medium text-slate-900">Dane schematu</h3>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="form_name">Nazwa</Label>
                <Input
                  id="form_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label htmlFor="form_code">Kod (np. 4-3-3)</Label>
                <Input
                  id="form_code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label htmlFor="form_desc">Opis</Label>
                <Textarea
                  id="form_desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  disabled={readOnly}
                />
              </div>
              {!readOnly && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={is_default}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  <span className="text-sm">Ustaw jako domyślny</span>
                </label>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900">Sloty ({slots.length}/11)</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {slots.map((s, i) => (
                <li
                  key={s.id ?? i}
                  className={`cursor-pointer rounded px-2 py-1 ${selectedSlotIndex === i ? "bg-slate-200" : "hover:bg-slate-100"}`}
                  onClick={() => { setSelectedSlotIndex(i); setSlotModalOpen(true); }}
                >
                  {s.position_code ?? "?"} {s.slot_label ? `(${s.slot_label})` : ""} — {s.depth}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {slotModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => { setSlotModalOpen(false); setSelectedSlotIndex(null); }}
              aria-hidden
            />
            <div
              className="relative z-[81] max-h-[90vh] w-[min(420px,92vw)] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedSlotIndex !== null ? "Edycja slotu" : "Nowy slot"}
              </h2>
              <div className="mt-4">
                <SlotForm
                  slot={selectedSlot}
                  positions={positions}
                  onSubmit={handleSaveSlot}
                  onCancel={() => { setSlotModalOpen(false); setSelectedSlotIndex(null); }}
                  onRemove={selectedSlotIndex !== null ? handleRemoveSlot : undefined}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
