import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  usePositionDictionary,
  useCreatePosition,
  useUpdatePosition,
  useDeactivatePosition,
} from "@/features/tactical/hooks/usePositionDictionary";
import { isPositionUsedInFormations } from "@/features/tactical/api/positionDictionary.api";
import { PositionForm, type PositionFormValues, type TemplatePositionOption, type FormTemplateOption } from "@/features/tactical/components/PositionForm";
import { usePositionFormTemplates } from "@/features/tactical/hooks/usePositionFormTemplate";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, PowerOff } from "lucide-react";
import type { PositionDictionaryRow } from "@/features/tactical/types";

export function TacticalPositionDictionaryPage() {
  const [activeOnly, setActiveOnly] = useState(true);
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingRow, setEditingRow] = useState<PositionDictionaryRow | null>(null);

  const { data: positions = [], isLoading } = usePositionDictionary(!activeOnly);
  const { data: formTemplates = [] } = usePositionFormTemplates();
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const deactivatePosition = useDeactivatePosition();

  const formTemplateOptions: FormTemplateOption[] = formTemplates.map((t) => ({
    id: t.id,
    label: t.name,
  }));
  const templatePositionOptions: TemplatePositionOption[] = positions
    .filter((p) => p.id !== editingRow?.id)
    .map((p) => ({ id: p.id, label: `${p.position_code} — ${p.position_name_pl}` }));

  const handleCreate = async (values: PositionFormValues) => {
    try {
      await createPosition.mutateAsync({
        position_number: values.position_number,
        position_code: values.position_code,
        position_name_pl: values.position_name_pl,
        description: values.description || null,
        display_order: values.display_order,
        criteria_template_position_id: values.criteria_template_position_id || null,
        form_template_id: values.form_template_id || null,
      });
      toast({ title: "Dodano pozycję" });
      setModalOpen(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd zapisu";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleUpdate = async (values: PositionFormValues) => {
    if (!editingRow) return;
    try {
      await updatePosition.mutateAsync({
        id: editingRow.id,
        input: {
          position_number: values.position_number,
          position_code: values.position_code,
          position_name_pl: values.position_name_pl,
          description: values.description || null,
          display_order: values.display_order,
          criteria_template_position_id: values.criteria_template_position_id || null,
          form_template_id: values.form_template_id || null,
        },
      });
      toast({ title: "Zaktualizowano" });
      setEditingRow(null);
      setModalOpen(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd zapisu";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleDeactivate = async (row: PositionDictionaryRow) => {
    const used = await isPositionUsedInFormations(row.id);
    if (used) {
      const ok = window.confirm(
        "Ta pozycja jest używana w schematach taktycznych. Dezaktywacja ukryje ją w nowych formularzach, ale istniejące schematy zachowają dane. Kontynuować?"
      );
      if (!ok) return;
    } else {
      const ok = window.confirm("Ukryć tę pozycję w nowych formularzach?");
      if (!ok) return;
    }
    try {
      await deactivatePosition.mutateAsync(row.id);
      toast({ title: "Pozycja dezaktywowana" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <Link
            to="/settings/dictionaries"
            className="inline-flex items-center gap-2 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót do słowników
          </Link>
          <Link
            to="/settings/form-templates"
            className="inline-flex items-center gap-2 hover:text-slate-900"
          >
            Wzory formularzy
          </Link>
        </div>
      </div>
      <PageHeader
        title="Słownik pozycji (taktyka)"
        subtitle="Pozycje zawodników używane w schematach taktycznych. Nr 1–11 + sloty zmienne (WB, SW, SS)."
        actions={
          <Button onClick={() => { setEditingRow(null); setModalOpen("add"); }}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj pozycję
          </Button>
        }
      />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Tylko aktywne
        </label>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-slate-500">Ładowanie…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Nr</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Kod</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Nazwa PL</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Wzór (Senior)</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Opis</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((row) => {
                    const templateLabel = row.criteria_template_position_id
                      ? positions.find((p) => p.id === row.criteria_template_position_id)?.position_code ?? row.criteria_template_position_id.slice(0, 8)
                      : "—";
                    return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-100 ${!row.is_active ? "bg-slate-50 text-slate-500" : ""}`}
                    >
                      <td className="px-4 py-3">{row.position_number}</td>
                      <td className="px-4 py-3 font-medium">{row.position_code}</td>
                      <td className="px-4 py-3">{row.position_name_pl}</td>
                      <td className="px-4 py-3 text-slate-600">{templateLabel}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">
                        {row.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRow(row);
                              setModalOpen("edit");
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {row.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(row)}
                              title="Dezaktywuj"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ); })}
                </tbody>
              </table>
              {positions.length === 0 && (
                <p className="p-4 text-sm text-slate-500">Brak pozycji.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {typeof document !== "undefined" && modalOpen && (
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => { setModalOpen(null); setEditingRow(null); }}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(480px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {editingRow ? "Edycja pozycji" : "Nowa pozycja"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Unikalna kombinacja numeru i kodu. Pozycje 4 i 5 mogą mieć ten sam kod CB.
              </p>
              <div className="mt-4">
                <PositionForm
                  initial={editingRow ?? undefined}
                  templatePositionOptions={templatePositionOptions}
                  formTemplateOptions={formTemplateOptions}
                  onSubmit={editingRow ? handleUpdate : handleCreate}
                  onCancel={() => { setModalOpen(null); setEditingRow(null); }}
                  isSubmitting={createPosition.isPending || updatePosition.isPending}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}
