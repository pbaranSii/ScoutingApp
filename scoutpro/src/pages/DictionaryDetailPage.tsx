import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getDictionaryByRoute } from "@/features/dictionaries/config";
import {
  useDictionaryEntries,
  useCreateDictionaryEntry,
  useUpdateDictionaryEntry,
  useToggleDictionaryEntryActive,
} from "@/features/dictionaries/hooks/useDictionaries";
import type { DictionaryRow } from "@/features/dictionaries/api/dictionaries.api";
import { DictionaryEntryForm } from "@/features/dictionaries/components/DictionaryEntryForm";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

export function DictionaryDetailPage() {
  const { route } = useParams<{ route: string }>();
  const config = route ? getDictionaryByRoute(route) ?? null : null;

  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingRow, setEditingRow] = useState<DictionaryRow | null>(null);

  const { data: entries = [], isLoading, isError, error } = useDictionaryEntries(config ?? null, {
    activeOnly: config?.activeColumn !== "id" ? activeOnly : undefined,
    search: search.trim() || undefined,
  });
  const createEntry = useCreateDictionaryEntry(config ?? null);
  const updateEntry = useUpdateDictionaryEntry(config ?? null);
  const toggleActive = useToggleDictionaryEntryActive(config ?? null);

  const hasActiveColumn = config?.activeColumn && config.activeColumn !== "id";

  const handleCreate = async (payload: Record<string, unknown>) => {
    try {
      await createEntry.mutateAsync(payload);
      toast({ title: "Dodano pozycję" });
      setModalOpen(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd zapisu";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleUpdate = async (payload: Record<string, unknown>) => {
    if (!editingRow) return;
    try {
      await updateEntry.mutateAsync({ id: editingRow.id, payload });
      toast({ title: "Zaktualizowano" });
      setEditingRow(null);
      setModalOpen(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd zapisu";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleToggleActive = async (row: DictionaryRow) => {
    const active = row[config!.activeColumn as keyof DictionaryRow];
    const next = !active;
    try {
      await toggleActive.mutateAsync({ id: row.id, isActive: next });
      toast({ title: next ? "Aktywowano" : "Dezaktywowano" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleRemove = async (row: DictionaryRow) => {
    if (
      !window.confirm(
        "Ukryć tę pozycję? Nie będzie dostępna w nowych obserwacjach. Istniejące obserwacje zachowają ten tag."
      )
    ) {
      return;
    }
    try {
      await toggleActive.mutateAsync({ id: row.id, isActive: false });
      toast({
        title: "Pozycja ukryta",
        description: "Nie będzie wyświetlana w formularzu obserwacji. Możesz ją ponownie włączyć, odznaczając „Tylko aktywne”.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  if (!config) {
    return (
      <div className="mx-auto w-full max-w-[960px] space-y-4">
        <p className="text-slate-600">Nie znaleziono słownika.</p>
        <Button variant="outline" asChild>
          <Link to="/settings/dictionaries" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
          </Link>
        </Button>
      </div>
    );
  }

  const codeCol = config.codeColumn;
  const showCodeColumn = codeCol !== "id";
  const nameCol = config.nameColumn;
  const nameEnCol = config.nameEnColumn;

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/settings/dictionaries" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do słowników
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setEditingRow(null); setModalOpen("add"); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj pozycję
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{config.namePl}</h1>
        <p className="text-sm text-slate-600">Pozycje słownika: {entries.length}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Szukaj..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {hasActiveColumn && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Tylko aktywne
          </label>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Ładowanie…</p>}
      {isError && (
        <p className="text-sm text-red-600">
          Błąd: {error instanceof Error ? error.message : "Nie udało się załadować danych."}
        </p>
      )}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-[400px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                {showCodeColumn && (
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Kod</th>
                )}
                <th className="px-3 py-2 text-left font-medium text-slate-700">Nazwa</th>
                {nameEnCol && (
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Nazwa (EN)</th>
                )}
                {hasActiveColumn && (
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                )}
                <th className="px-3 py-2 text-right font-medium text-slate-700">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  {showCodeColumn && (
                    <td className="px-3 py-2 text-slate-600">{String(row[codeCol] ?? "")}</td>
                  )}
                  <td className="px-3 py-2 font-medium">{String(row[nameCol] ?? "")}</td>
                  {nameEnCol && (
                    <td className="px-3 py-2 text-slate-600">{String(row[nameEnCol] ?? "")}</td>
                  )}
                  {hasActiveColumn && (
                    <td className="px-3 py-2">
                      <Badge variant={row[config.activeColumn as keyof DictionaryRow] ? "default" : "secondary"}>
                        {row[config.activeColumn as keyof DictionaryRow] ? "Aktywny" : "Nieaktywny"}
                      </Badge>
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingRow(row); setModalOpen("edit"); }}
                        title="Edytuj"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {hasActiveColumn && row[config.activeColumn as keyof DictionaryRow] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(row)}
                          disabled={toggleActive.isPending}
                          title="Usuń (ukryj z listy)"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {hasActiveColumn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(row)}
                          disabled={toggleActive.isPending}
                          title={row[config.activeColumn as keyof DictionaryRow] ? "Dezaktywuj" : "Aktywuj"}
                        >
                          {row[config.activeColumn as keyof DictionaryRow] ? (
                            <PowerOff className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Power className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <p className="text-sm text-slate-500">Brak pozycji. Dodaj pierwszą.</p>
      )}

      {typeof document !== "undefined" &&
        modalOpen &&
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
                {editingRow ? "Edytuj pozycję" : "Dodaj pozycję"}
              </h2>
              <div className="mt-4">
                <DictionaryEntryForm
                  config={config}
                  initial={editingRow ?? undefined}
                  onSubmit={editingRow ? handleUpdate : handleCreate}
                  onCancel={() => { setModalOpen(null); setEditingRow(null); }}
                  isSubmitting={createEntry.isPending || updateEntry.isPending}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
