import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { DataTransferBundle, ImportPreflightReport } from "@/features/dataTransfer/types";
import { commitImportBundle, exportDataBundle, preflightImportBundle } from "@/features/dataTransfer/api/dataTransfer.api";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminDataTransferPage() {
  const [isExporting, setIsExporting] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [bundle, setBundle] = useState<DataTransferBundle | null>(null);
  const [preflight, setPreflight] = useState<ImportPreflightReport | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const canCommit = Boolean(preflight?.ok && bundle);

  const issueCounts = useMemo(() => {
    const issues = preflight?.issues ?? [];
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    return { errors, warnings, total: issues.length };
  }, [preflight]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const b = await exportDataBundle();
      downloadJson(`scoutpro-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`, b);
      toast({ title: "Eksport gotowy", description: "Plik JSON został pobrany." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nie udało się wykonać eksportu.";
      toast({ variant: "destructive", title: "Błąd eksportu", description: msg });
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoadFile = async (file: File) => {
    setImportFile(file);
    setBundle(null);
    setPreflight(null);
    setRunId(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as DataTransferBundle;
      setBundle(parsed);
      toast({ title: "Plik wczytany", description: "Możesz uruchomić preflight." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nie udało się wczytać pliku.";
      toast({ variant: "destructive", title: "Błąd pliku", description: msg });
    }
  };

  const handlePreflight = async () => {
    if (!bundle) return;
    setIsPreflighting(true);
    try {
      const { report, runId } = await preflightImportBundle(bundle);
      setPreflight(report);
      setRunId(runId);
      toast({
        title: report.ok ? "Preflight OK" : "Preflight: błędy",
        description: report.ok ? "Możesz wykonać import." : "Import jest zablokowany do czasu usunięcia błędów.",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nie udało się uruchomić preflight.";
      toast({ variant: "destructive", title: "Błąd preflight", description: msg });
    } finally {
      setIsPreflighting(false);
    }
  };

  const handleCommit = async () => {
    if (!bundle || !preflight?.ok) return;
    const confirmed = window.confirm("Wykonać import do bazy danych? Operacja może potrwać.");
    if (!confirmed) return;
    setIsCommitting(true);
    try {
      const res = await commitImportBundle({ bundle, runId });
      toast({ title: "Import uruchomiony", description: `Status: ${res.status}` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nie udało się wykonać importu.";
      toast({ variant: "destructive", title: "Błąd importu", description: msg });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import / Export danych"
        subtitle="Eksportuj i importuj zawodników oraz obserwacje (JSON bundle). Tylko administrator."
      />

      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export">Eksport</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eksport danych</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Pobierze JSON bundle z zawodnikami, obserwacjami i referencjami (użytkownicy/kluby/regiony/kategorie).
              </p>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? "Eksportuję..." : "Pobierz eksport (JSON)"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import danych</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  1) Wczytaj plik eksportu JSON, 2) uruchom preflight, 3) jeśli brak błędów – wykonaj import.
                </p>
                <Input
                  type="file"
                  accept="application/json"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f) void handleLoadFile(f);
                  }}
                />
                {importFile && (
                  <p className="text-xs text-slate-500">
                    Plik: {importFile.name} ({Math.round(importFile.size / 1024)} KB)
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handlePreflight} disabled={!bundle || isPreflighting}>
                  {isPreflighting ? "Sprawdzam..." : "Preflight (sprawdź i raportuj)"}
                </Button>
                <Button onClick={handleCommit} disabled={!canCommit || isCommitting}>
                  {isCommitting ? "Importuję..." : "Wykonaj import"}
                </Button>
              </div>

              {preflight && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">
                      Wynik: {preflight.ok ? "OK" : "BŁĘDY"}
                    </div>
                    <div className="text-xs text-slate-600">
                      Issues: {issueCounts.total} (errors: {issueCounts.errors}, warnings: {issueCounts.warnings})
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                    <div>Użytkownicy: {preflight.summary.users}</div>
                    <div>Zawodnicy: {preflight.summary.players}</div>
                    <div>Obserwacje: {preflight.summary.observations}</div>
                    <div>Kluby: {preflight.summary.clubs}</div>
                    <div>Regiony: {preflight.summary.regions}</div>
                    <div>Kategorie: {preflight.summary.categories}</div>
                  </div>
                  {preflight.issues.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-700">
                      {preflight.issues.slice(0, 20).map((i, idx) => (
                        <li key={`${i.code}-${idx}`}>
                          <span className={i.severity === "error" ? "text-rose-700" : i.severity === "warning" ? "text-amber-700" : ""}>
                            [{i.severity}] {i.code}
                          </span>{" "}
                          – {i.message}
                          {typeof i.count === "number" ? ` (count: ${i.count})` : ""}
                          {i.path ? ` @ ${i.path}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!preflight && (
                <p className="text-xs text-slate-500">
                  Preflight zapisuje audit w `import_runs` i blokuje import, jeśli wykryje błędy krytyczne.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

