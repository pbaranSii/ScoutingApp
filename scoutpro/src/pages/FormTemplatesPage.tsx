import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  usePositionFormTemplates,
  usePositionFormTemplateElements,
  useEvaluationCriteriaPool,
  useCreatePositionFormTemplate,
  useUpdatePositionFormTemplate,
  useDeletePositionFormTemplate,
  useSetPositionFormTemplateElements,
  useCreateTemplateFromPosition,
} from "@/features/tactical/hooks/usePositionFormTemplate";
import { usePositionDictionary } from "@/features/tactical/hooks/usePositionDictionary";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Plus, Trash2, ChevronUp, ChevronDown, Type } from "lucide-react";
import type { PositionFormTemplateWithCount, TemplateElement } from "@/features/tactical/api/positionFormTemplate.api";

export function FormTemplatesPage() {
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [elementsInitialized, setElementsInitialized] = useState(false);
  const [createFromPositionId, setCreateFromPositionId] = useState<string>("");

  const { data: templates = [], isLoading } = usePositionFormTemplates();
  const { data: positions = [] } = usePositionDictionary(false);
  const { data: templateElements = [] } = usePositionFormTemplateElements(editingId);
  const { data: criteriaPool = [] } = useEvaluationCriteriaPool();
  const createTemplate = useCreatePositionFormTemplate();
  const updateTemplate = useUpdatePositionFormTemplate();
  const deleteTemplate = useDeletePositionFormTemplate();
  const setElementsMutation = useSetPositionFormTemplateElements();
  const createFromPosition = useCreateTemplateFromPosition();

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setElements([]);
    setCreateFromPositionId("");
    setModalOpen("add");
  };

  const openEdit = (t: PositionFormTemplateWithCount) => {
    setEditingId(t.id);
    setName(t.name);
    setDescription(t.description ?? "");
    setElements([]);
    setModalOpen("edit");
  };

  useEffect(() => {
    if (modalOpen === "edit" && editingId && templateElements.length > 0 && !elementsInitialized) {
      setElements(templateElements);
      setElementsInitialized(true);
    }
  }, [modalOpen, editingId, templateElements, elementsInitialized]);

  useEffect(() => {
    if (!modalOpen) setElementsInitialized(false);
  }, [modalOpen]);

  const handleSaveNew = async () => {
    const nameTrim = name.trim();
    if (!nameTrim) {
      toast({ variant: "destructive", title: "Podaj nazwę wzoru" });
      return;
    }
    if (createFromPositionId) {
      try {
        await createFromPosition.mutateAsync({
          templateName: nameTrim,
          positionId: createFromPositionId,
        });
        toast({ title: "Dodano wzór z kryteriów pozycji" });
        setModalOpen(null);
      } catch (e) {
        toast({ variant: "destructive", title: "Błąd", description: e instanceof Error ? e.message : "Nie udało się" });
      }
      return;
    }
    try {
      const created = await createTemplate.mutateAsync({ name: nameTrim, description: description.trim() || null });
      if (created?.id && elements.length > 0) {
        await setElementsMutation.mutateAsync({
          templateId: created.id,
          elements: elements.map((el, idx) =>
            el.type === "header"
              ? { element_type: "header" as const, sort_order: idx, header_label: el.header_label }
              : { element_type: "criterion" as const, sort_order: idx, evaluation_criterion_id: el.evaluation_criterion_id, is_required: el.is_required }
          ),
        });
      }
      toast({ title: "Dodano wzór" });
      setModalOpen(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Błąd", description: e instanceof Error ? e.message : "Nie udało się" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const nameTrim = name.trim();
    if (!nameTrim) {
      toast({ variant: "destructive", title: "Podaj nazwę wzoru" });
      return;
    }
    try {
      await updateTemplate.mutateAsync({
        id: editingId,
        input: { name: nameTrim, description: description.trim() || null },
      });
      await setElementsMutation.mutateAsync({
        templateId: editingId,
        elements: elements.map((el, idx) =>
          el.type === "header"
            ? { element_type: "header" as const, sort_order: idx, header_label: el.header_label }
            : { element_type: "criterion" as const, sort_order: idx, evaluation_criterion_id: el.evaluation_criterion_id, is_required: el.is_required }
        ),
      });
      toast({ title: "Zaktualizowano wzór" });
      setModalOpen(null);
      setEditingId(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Błąd", description: e instanceof Error ? e.message : "Nie udało się" });
    }
  };

  const handleDelete = async (t: PositionFormTemplateWithCount) => {
    if (!window.confirm(`Usunąć wzór „${t.name}"?`)) return;
    try {
      await deleteTemplate.mutateAsync(t.id);
      toast({ title: "Usunięto wzór" });
    } catch (e) {
      toast({ variant: "destructive", title: "Błąd", description: e instanceof Error ? e.message : "Nie udało się" });
    }
  };

  const moveElement = (index: number, dir: 1 | -1) => {
    const next = [...elements];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setElements(next.map((el, i) => ({ ...el, sort_order: i })));
  };

  const addHeader = () => {
    setElements((prev) => [
      ...prev,
      { type: "header", sort_order: prev.length, header_label: "Nowy nagłówek" },
    ]);
  };

  const updateHeaderLabel = (index: number, label: string) => {
    setElements((prev) =>
      prev.map((el, i) => (i === index && el.type === "header" ? { ...el, header_label: label } : el))
    );
  };

  const addCriterion = (criterionId: string) => {
    const c = criteriaPool.find((x) => x.id === criterionId);
    if (!c || elements.some((e) => e.type === "criterion" && e.evaluation_criterion_id === criterionId)) return;
    setElements((prev) => [
      ...prev,
      {
        type: "criterion",
        sort_order: prev.length,
        evaluation_criterion_id: c.id,
        criterion_name: c.name,
        criterion_section: c.section,
        is_required: c.is_required,
      },
    ]);
  };

  const removeElement = (index: number) => {
    setElements((prev) => prev.filter((_, i) => i !== index).map((el, i) => ({ ...el, sort_order: i })));
  };

  const toggleRequired = (index: number) => {
    setElements((prev) =>
      prev.map((el, i) =>
        i === index && el.type === "criterion" ? { ...el, is_required: !el.is_required } : el
      )
    );
  };

  const isSubmitting =
    createTemplate.isPending ||
    updateTemplate.isPending ||
    setElementsMutation.isPending ||
    createFromPosition.isPending;

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/settings" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do ustawień
        </Link>
      </div>
      <PageHeader
        title="Wzory formularzy opisu pozycji"
        subtitle="Definiuj zestawy kryteriów (sekcja 4b) dla formularza Senior. Wzór można przypisać do pozycji w Słowniku pozycji."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj wzór
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-slate-500">Ładowanie…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Nazwa</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Opis</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Elementy</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-700">Przypisane do</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">
                        {row.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.elements_count ?? 0}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">
                        {(row.assigned_positions ?? []).length > 0
                          ? (row.assigned_positions ?? []).map((p) => p.position_code).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(row)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {templates.length === 0 && (
                <p className="p-4 text-sm text-slate-500">Brak wzorów. Kliknij „Dodaj wzór”.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {typeof document !== "undefined" && modalOpen && (
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => { setModalOpen(null); setEditingId(null); }}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(560px,100%)] max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {modalOpen === "add" ? "Nowy wzór" : "Edycja wzoru"}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <Label>Nazwa</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="np. Środkowy obrońca – Senior"
                  />
                </div>
                <div>
                  <Label>Opis (opcjonalnie)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                {modalOpen === "add" && (
                  <div>
                    <Label>Utwórz wzór z pozycji</Label>
                    <Select
                      value={createFromPositionId || "__none__"}
                      onValueChange={(v) => setCreateFromPositionId(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pomiń — pusty wzór" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Pomiń — pusty wzór</SelectItem>
                        {positions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.position_number > 0 ? `${p.position_number} – ` : ""}{p.position_code} – {p.position_name_pl}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-slate-500">
                      Skopiuj kryteria z wybranej pozycji do nowego wzoru.
                    </p>
                  </div>
                )}
                {(modalOpen === "edit" || (modalOpen === "add" && !createFromPositionId)) && (
                  <>
                    <div>
                      <Label>Elementy wzoru (kolejność wyświetlania)</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={addHeader} className="gap-1">
                          <Type className="h-4 w-4" />
                          Dodaj nagłówek
                        </Button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {elements.map((el, idx) =>
                          el.type === "header" ? (
                            <div
                              key={`header-${idx}`}
                              className="flex items-center gap-2 rounded border border-slate-300 bg-slate-100 p-2"
                            >
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveElement(idx, -1)}
                                  disabled={idx === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveElement(idx, 1)}
                                  disabled={idx === elements.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <span className="text-xs font-medium text-slate-500">Nagłówek</span>
                              <Input
                                value={el.header_label}
                                onChange={(e) => updateHeaderLabel(idx, e.target.value)}
                                placeholder="np. DEFENSYWA — BRONIENIE"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                onClick={() => removeElement(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              key={el.evaluation_criterion_id}
                              className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2"
                            >
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveElement(idx, -1)}
                                  disabled={idx === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveElement(idx, 1)}
                                  disabled={idx === elements.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{el.criterion_name}</p>
                                {el.criterion_section && (
                                  <p className="text-xs text-slate-500">{el.criterion_section}</p>
                                )}
                              </div>
                              <label className="flex shrink-0 items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={el.is_required}
                                  onChange={() => toggleRequired(idx)}
                                />
                                Wymagane
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                onClick={() => removeElement(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Dodaj pole</Label>
                      <Select
                        value=""
                        onValueChange={(v) => {
                          if (v) addCriterion(v);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz kryterium z bazy" />
                        </SelectTrigger>
                        <SelectContent>
                          {criteriaPool
                            .filter(
                              (c) =>
                                !elements.some(
                                  (e) => e.type === "criterion" && e.evaluation_criterion_id === c.id
                                )
                            )
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                                {c.position_code ? ` (${c.position_code})` : ""}
                              </SelectItem>
                            ))}
                          {criteriaPool.filter(
                            (c) =>
                              !elements.some(
                                (e) => e.type === "criterion" && e.evaluation_criterion_id === c.id
                              )
                          ).length === 0 && (
                            <SelectItem value="__none__" disabled>
                              Wszystkie kryteria dodane
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setModalOpen(null); setEditingId(null); }}
                  disabled={isSubmitting}
                >
                  Anuluj
                </Button>
                <Button
                  type="button"
                  onClick={modalOpen === "add" ? handleSaveNew : handleSaveEdit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Zapisywanie…" : modalOpen === "add" ? "Dodaj" : "Zapisz"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}
