import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getDictionaryByRoute } from "@/features/dictionaries/config";
import {
  useDictionaryEntries,
  useCreateDictionaryEntry,
  useUpdateDictionaryEntry,
  useToggleDictionaryEntryActive,
  useLeagues,
} from "@/features/dictionaries/hooks/useDictionaries";
import type { DictionaryRow } from "@/features/dictionaries/api/dictionaries.api";
import {
  exportDictionaryCsvTemplate,
  exportDictionaryEntriesToCsv,
  importDictionaryEntriesFromCsv,
} from "@/features/dictionaries/api/dictionaries.api";
import { DictionaryEntryForm } from "@/features/dictionaries/components/DictionaryEntryForm";
import { toast } from "@/hooks/use-toast";
import { downloadText } from "@/features/analytics/utils/export";
import { ArrowLeft, Download, Import, Plus, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

export function DictionaryDetailPage() {
  const { route } = useParams<{ route: string }>();
  const config = route ? getDictionaryByRoute(route) ?? null : null;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [areaFilter, setAreaFilter] = useState<"ALL" | "AKADEMIA" | "SENIOR">("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState<"add" | "edit" | null>(null);
  const [editingRow, setEditingRow] = useState<DictionaryRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [applyIsActiveFromFile, setApplyIsActiveFromFile] = useState(true);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: { row: number; message: string }[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [bulkLeagueId, setBulkLeagueId] = useState<string>("_nochange");
  const [bulkCountry, setBulkCountry] = useState("");
  const [bulkArea, setBulkArea] = useState<"NO_CHANGE" | "AKADEMIA" | "SENIOR" | "ALL">("NO_CHANGE");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const { data: entries = [], isLoading, isError, error } = useDictionaryEntries(config ?? null, {
    activeOnly: config?.activeColumn !== "id" ? activeOnly : undefined,
    search: search.trim() || undefined,
  });
  const createEntry = useCreateDictionaryEntry(config ?? null);
  const updateEntry = useUpdateDictionaryEntry(config ?? null);
  const toggleActive = useToggleDictionaryEntryActive(config ?? null);
  const { data: leagues = [] } = useLeagues();

  const hasActiveColumn = config?.activeColumn && config.activeColumn !== "id";

  const filenameDate = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const handleExportCsv = () => {
    try {
      const csv = exportDictionaryEntriesToCsv(config!, filteredEntries);
      downloadText(`Slownik_${config!.route}_${filenameDate()}.csv`, csv);
      toast({ title: "Wyeksportowano CSV" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd eksportu";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const csv = exportDictionaryCsvTemplate(config!);
      downloadText(`Szablon_${config!.route}.csv`, csv);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const res = await importDictionaryEntriesFromCsv(config!, text, { applyIsActiveFromFile });
      setImportResult(res);
      queryClient.invalidateQueries({ queryKey: ["dictionary-entries", config!.id] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-counts"] });
      toast({
        title: "Import zakończony",
        description: `Dodano: ${res.inserted}, zaktualizowano: ${res.updated}, pominięto: ${res.skipped}${
          res.errors.length ? `, błędy: ${res.errors.length}` : ""
        }`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd importu";
      toast({ variant: "destructive", title: "Błąd importu", description: msg });
    } finally {
      setImporting(false);
    }
  };

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

  const toggleClubSelection = (id: string) => {
    setSelectedClubIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const toggleSelectAllVisibleClubs = () => {
    if (allVisibleSelected) {
      setSelectedClubIds((prev) => prev.filter((id) => !visibleClubIds.includes(id)));
      return;
    }
    setSelectedClubIds((prev) => Array.from(new Set([...prev, ...visibleClubIds])));
  };

  const handleBulkUpdateClubs = async () => {
    if (!isClubsDictionary || selectedClubIds.length === 0) return;
    const payload: Record<string, unknown> = {};
    if (bulkLeagueId !== "_nochange") payload.league_id = bulkLeagueId === "_none" ? null : bulkLeagueId;
    if (bulkCountry.trim() !== "") payload.country_pl = bulkCountry.trim();
    if (bulkArea !== "NO_CHANGE") payload.area = bulkArea;
    if (Object.keys(payload).length === 0) {
      toast({
        variant: "destructive",
        title: "Brak zmian do zapisania",
        description: "Wybierz przynajmniej jedno pole do aktualizacji bulkowej.",
      });
      return;
    }
    try {
      setIsBulkUpdating(true);
      await Promise.all(selectedClubIds.map((id) => updateEntry.mutateAsync({ id, payload })));
      toast({
        title: "Zaktualizowano kluby",
        description: `Zmieniono ${selectedClubIds.length} pozycji.`,
      });
      setSelectedClubIds([]);
      setBulkLeagueId("_nochange");
      setBulkCountry("");
      setBulkArea("NO_CHANGE");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd aktualizacji bulkowej";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    } finally {
      setIsBulkUpdating(false);
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
  const isClubsDictionary = config.table === "clubs";
  const isLeaguesDictionary = config.table === "leagues";
  const isCategoriesDictionary = config.table === "categories";
  const supportsAreaFilter = isClubsDictionary || isLeaguesDictionary;
  const supportsCountryFilter = isClubsDictionary;
  const clubCountry = (row: DictionaryRow) =>
    String(
      row.country_pl ??
        (row.league as { country_pl?: string } | null)?.country_pl ??
        (row.leagues as { country_pl?: string } | null)?.country_pl ??
        "—"
    );
  const countryOptions = supportsCountryFilter
    ? ["ALL", ...Array.from(new Set(entries.map((row) => clubCountry(row)).filter((c) => c && c !== "—"))).sort((a, b) => a.localeCompare(b))]
    : [];
  const filteredEntries = supportsAreaFilter
    ? entries.filter((row) => {
        if (areaFilter === "ALL") return true;
        const rowArea = String(row.area ?? (isLeaguesDictionary ? "ALL" : "AKADEMIA")).toUpperCase();
        return rowArea === areaFilter;
      }).filter((row) => (supportsCountryFilter && countryFilter !== "ALL" ? clubCountry(row) === countryFilter : true))
    : entries;
  const visibleClubIds = useMemo(
    () => (isClubsDictionary ? filteredEntries.map((row) => row.id) : []),
    [isClubsDictionary, filteredEntries]
  );
  const allVisibleSelected =
    isClubsDictionary &&
    visibleClubIds.length > 0 &&
    visibleClubIds.every((id) => selectedClubIds.includes(id));

  useEffect(() => {
    if (!isClubsDictionary) {
      setSelectedClubIds([]);
      return;
    }
    const visible = new Set(visibleClubIds);
    setSelectedClubIds((prev) => prev.filter((id) => visible.has(id)));
  }, [isClubsDictionary, visibleClubIds]);

  const defaultFormTypeLabel = (value: unknown) =>
    value === "extended" ? "Rozszerzony" : "Uproszczony";

  const referenceBirthYear = (row: DictionaryRow) => {
    if (config?.table !== "categories") return null;
    const au = row.age_under;
    if (au == null || au === "") return null;
    const n = Number(au);
    if (Number.isNaN(n)) return null;
    return new Date().getFullYear() - n;
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/settings/dictionaries" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do słowników
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="gap-2"
            title="Importuj pozycje z pliku CSV"
          >
            <Import className="h-4 w-4" />
            Importuj CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="gap-2"
            title="Eksportuj aktualnie widoczne pozycje do CSV"
          >
            <Download className="h-4 w-4" />
            Eksportuj CSV
          </Button>
          <Button onClick={() => { setEditingRow(null); setModalOpen("add"); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj pozycję
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{config.namePl}</h1>
        <p className="text-sm text-slate-600">
          Pozycje słownika: {filteredEntries.length}
          {filteredEntries.length !== entries.length ? ` z ${entries.length}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Szukaj..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {supportsAreaFilter && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>Obszar dostępu</span>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value as "ALL" | "AKADEMIA" | "SENIOR")}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="ALL">Wszystkie</option>
              <option value="AKADEMIA">AKADEMIA</option>
              <option value="SENIOR">SENIOR</option>
            </select>
          </label>
        )}
        {supportsCountryFilter && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>Kraj</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country === "ALL" ? "Wszystkie" : country}
                </option>
              ))}
            </select>
          </label>
        )}
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

      {isClubsDictionary && (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-sm font-medium text-slate-800">
            Operacje bulkowe ({selectedClubIds.length} zaznaczonych)
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Liga</span>
              <select
                value={bulkLeagueId}
                onChange={(e) => setBulkLeagueId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="_nochange">Bez zmian</option>
                <option value="_none">Wyczyść</option>
                {leagues.map((league) => (
                  <option key={league.id} value={String(league.id)}>
                    {String((league as Record<string, unknown>).display_name ?? league.name ?? league.id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Kraj</span>
              <Input
                value={bulkCountry}
                onChange={(e) => setBulkCountry(e.target.value)}
                placeholder="Podaj kraj (np. Polska)"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Obszar dostępu</span>
              <select
                value={bulkArea}
                onChange={(e) => setBulkArea(e.target.value as "NO_CHANGE" | "AKADEMIA" | "SENIOR" | "ALL")}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="NO_CHANGE">Bez zmian</option>
                <option value="AKADEMIA">AKADEMIA</option>
                <option value="SENIOR">SENIOR</option>
                <option value="ALL">ALL</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleBulkUpdateClubs} disabled={selectedClubIds.length === 0 || isBulkUpdating}>
              {isBulkUpdating ? "Aktualizowanie..." : "Zastosuj do zaznaczonych"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedClubIds([])}
              disabled={selectedClubIds.length === 0 || isBulkUpdating}
            >
              Wyczyść zaznaczenie
            </Button>
          </div>
        </div>
      )}

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
                {isClubsDictionary && (
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisibleClubs}
                      aria-label="Zaznacz wszystkie widoczne kluby"
                    />
                  </th>
                )}
                {showCodeColumn && (
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Kod</th>
                )}
                <th className="px-3 py-2 text-left font-medium text-slate-700">Nazwa</th>
                {nameEnCol && (
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Nazwa (EN)</th>
                )}
                {isClubsDictionary && (
                  <>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Województwo</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Miasto</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Liga</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Kraj</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Obszar dostępu</th>
                  </>
                )}
                {isLeaguesDictionary && (
                  <>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Kraj</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Poziom</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Obszar</th>
                  </>
                )}
                {isCategoriesDictionary && (
                  <>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Obszar</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Domyślny typ formularza</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Rocznik (oblicz.)</th>
                  </>
                )}
                {hasActiveColumn && (
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                )}
                <th className="px-3 py-2 text-right font-medium text-slate-700">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  {isClubsDictionary && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedClubIds.includes(row.id)}
                        onChange={() => toggleClubSelection(row.id)}
                        aria-label={`Zaznacz klub ${String(row[nameCol] ?? "")}`}
                      />
                    </td>
                  )}
                  {showCodeColumn && (
                    <td className="px-3 py-2 text-slate-600">{String(row[codeCol] ?? "")}</td>
                  )}
                  <td className="px-3 py-2 font-medium">{String(row[nameCol] ?? "")}</td>
                  {nameEnCol && (
                    <td className="px-3 py-2 text-slate-600">{String(row[nameEnCol] ?? "")}</td>
                  )}
                  {isClubsDictionary && (
                    <>
                      <td className="px-3 py-2 text-slate-600">
                        {String((row.region as { name?: string } | null)?.name ?? (row.regions as { name?: string } | null)?.name ?? "")}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{String(row.city ?? "")}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {String((row.league as { name?: string } | null)?.name ?? (row.leagues as { name?: string } | null)?.name ?? "—")}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{clubCountry(row)}</td>
                      <td className="px-3 py-2 text-slate-600">{String(row.area ?? "AKADEMIA")}</td>
                    </>
                  )}
                  {isLeaguesDictionary && (
                    <>
                      <td className="px-3 py-2 text-slate-600">{String(row.country_pl ?? "—")}</td>
                      <td className="px-3 py-2 text-slate-600">{String(row.level ?? "—")}</td>
                      <td className="px-3 py-2 text-slate-600">{String(row.area ?? "ALL")}</td>
                    </>
                  )}
                  {isCategoriesDictionary && (
                    <>
                      <td className="px-3 py-2 text-slate-600">
                        {String(row.area ?? "AKADEMIA")}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {defaultFormTypeLabel(row.default_form_type)}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {referenceBirthYear(row) ?? "—"}
                      </td>
                    </>
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
                      {hasActiveColumn && Boolean(row[config.activeColumn as keyof DictionaryRow]) && (
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

      {!isLoading && !isError && filteredEntries.length === 0 && (
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

      {typeof document !== "undefined" &&
        importOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                if (importing) return;
                setImportOpen(false);
                setImportFile(null);
                setImportResult(null);
              }}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(640px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900">Import CSV</h2>
              <p className="mt-1 text-sm text-slate-600">
                Zaimportuj pozycje słownika: <span className="font-medium">{config.namePl}</span>.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                    <Download className="h-4 w-4" />
                    Pobierz szablon CSV
                  </Button>
                  {hasActiveColumn && (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={applyIsActiveFromFile}
                        onChange={(e) => setApplyIsActiveFromFile(e.target.checked)}
                        disabled={importing}
                      />
                      Ustawiaj status aktywności z pliku (kolumna <code>is_active</code>)
                    </label>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    disabled={importing}
                  />
                  <p className="mt-1 text-xs text-slate-500">CSV powinien mieć nagłówki w pierwszym wierszu.</p>
                </div>

                {importResult && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>Dodano: <strong>{importResult.inserted}</strong></span>
                      <span>Zaktualizowano: <strong>{importResult.updated}</strong></span>
                      <span>Pominięto: <strong>{importResult.skipped}</strong></span>
                      <span>Błędy: <strong>{importResult.errors.length}</strong></span>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-auto rounded border border-slate-200 bg-white p-2 text-xs text-slate-700">
                        {importResult.errors.slice(0, 50).map((er, idx) => (
                          <div key={idx}>
                            Wiersz {er.row}: {er.message}
                          </div>
                        ))}
                        {importResult.errors.length > 50 && (
                          <div className="mt-1 text-slate-500">…i {importResult.errors.length - 50} kolejnych</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (importing) return;
                    setImportOpen(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  disabled={importing}
                >
                  Zamknij
                </Button>
                <Button type="button" onClick={handleImport} disabled={!importFile || importing}>
                  {importing ? "Importowanie…" : "Importuj"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
