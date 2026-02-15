import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { DictionaryConfig } from "../config";

export type DictionaryRow = Record<string, unknown> & { id: string };

type TableName = keyof Database["public"]["Tables"];

export async function fetchDictionaryCount(config: DictionaryConfig): Promise<{ total: number; active: number }> {
  const table = config.table as TableName;
  const activeCol = config.activeColumn;

  const { count: total, error: totalError } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (totalError) throw totalError;

  let active = total ?? 0;
  if (activeCol !== "id") {
    const { count: activeCount, error: activeError } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(activeCol, true);
    if (!activeError) active = activeCount ?? 0;
  }

  return { total: total ?? 0, active };
}

export async function fetchDictionaryEntries(
  config: DictionaryConfig,
  options?: { activeOnly?: boolean; search?: string }
): Promise<DictionaryRow[]> {
  const table = config.table;
  const nameCol = config.nameColumn;
  const activeCol = config.activeColumn;

  const tableName = table as TableName;
  let q = supabase
    .from(tableName)
    .select("*")
    .order(nameCol, { ascending: true, nullsFirst: false });

  if (activeCol !== "id" && options?.activeOnly === true) {
    q = q.eq(activeCol, true);
  }
  if (options?.search?.trim()) {
    q = q.ilike(nameCol, `%${options.search.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as DictionaryRow[];
  rows.sort((a, b) => {
    const na = String(a[nameCol] ?? "").toLowerCase();
    const nb = String(b[nameCol] ?? "").toLowerCase();
    return na.localeCompare(nb);
  });
  return rows;
}

export async function createDictionaryEntry(
  config: DictionaryConfig,
  payload: Record<string, unknown>
): Promise<DictionaryRow> {
  const table = config.table as TableName;
  const { data, error } = await supabase
    .from(table)
    .insert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return data as DictionaryRow;
}

export async function updateDictionaryEntry(
  config: DictionaryConfig,
  id: string,
  payload: Record<string, unknown>
): Promise<DictionaryRow> {
  const table = config.table;
  if (table.startsWith("dict_")) {
    payload.updated_at = new Date().toISOString();
  }
  const tableName = config.table as TableName;
  const { data, error } = await supabase
    .from(tableName)
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DictionaryRow;
}

export async function toggleDictionaryEntryActive(
  config: DictionaryConfig,
  id: string,
  isActive: boolean
): Promise<DictionaryRow> {
  const activeCol = config.activeColumn;
  if (activeCol === "id") throw new Error("Table has no is_active column");
  const payload: Record<string, unknown> = { [activeCol]: isActive };
  if (config.table.startsWith("dict_")) {
    payload.updated_at = new Date().toISOString();
  }
  return updateDictionaryEntry(config, id, payload);
}

export async function deleteDictionaryEntry(config: DictionaryConfig, id: string): Promise<void> {
  const table = config.table as TableName;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
