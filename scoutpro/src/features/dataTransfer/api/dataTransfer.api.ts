import { supabase } from "@/lib/supabase";
import type { DataTransferBundle, ImportPreflightReport } from "../types";

export async function exportDataBundle(): Promise<DataTransferBundle> {
  const { data, error } = await supabase.functions.invoke("admin-data-transfer", {
    body: { action: "export" },
  });
  if (error) throw error;
  const bundle = (data as { bundle?: DataTransferBundle } | null)?.bundle;
  if (!bundle) throw new Error("Brak bundla w odpowiedzi export.");
  return bundle;
}

export async function preflightImportBundle(bundle: DataTransferBundle) {
  const { data, error } = await supabase.functions.invoke("admin-data-transfer", {
    body: { action: "preflight", bundle },
  });
  if (error) throw error;
  const report = (data as { report?: ImportPreflightReport } | null)?.report;
  const runId = (data as { runId?: string } | null)?.runId ?? null;
  if (!report) throw new Error("Brak raportu w odpowiedzi preflight.");
  return { report, runId };
}

export async function commitImportBundle(input: { bundle: DataTransferBundle; runId?: string | null }) {
  const { data, error } = await supabase.functions.invoke("admin-data-transfer", {
    body: { action: "commit", bundle: input.bundle, runId: input.runId ?? null },
  });
  if (error) throw error;
  return data as { status: string; report?: ImportPreflightReport };
}

