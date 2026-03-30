import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type PositionFormTemplateRow = Database["public"]["Tables"]["position_form_template"]["Row"];
export type PositionFormTemplateInsert = Database["public"]["Tables"]["position_form_template"]["Insert"];
export type PositionFormTemplateUpdate = Database["public"]["Tables"]["position_form_template"]["Update"];
export type PositionFormTemplateElementRow = Database["public"]["Tables"]["position_form_template_element"]["Row"];

export type CriterionSection = Database["public"]["Enums"]["criterion_section"];

/** Criterion from evaluation_criteria with optional position code for grouping. */
export interface EvaluationCriterionOption {
  id: string;
  name: string;
  section: CriterionSection | null;
  code: string | null;
  is_required: boolean;
  sort_order: number;
  position_code?: string;
}

/** One element in template editor: header or criterion. */
export type TemplateElement =
  | { type: "header"; id?: string; sort_order: number; header_label: string }
  | {
      type: "criterion";
      id?: string;
      sort_order: number;
      evaluation_criterion_id: string;
      criterion_name: string;
      criterion_section: CriterionSection | null;
      is_required: boolean;
    };

/** Template with element count and assigned positions. */
export interface PositionFormTemplateWithCount extends PositionFormTemplateRow {
  elements_count?: number;
  assigned_positions?: { id: string; position_code: string; position_name_pl: string }[];
}

/** List all form templates with element counts and assigned positions. */
export async function fetchPositionFormTemplates(): Promise<PositionFormTemplateWithCount[]> {
  const { data: templates, error } = await supabase
    .from("position_form_template")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  const list = (templates ?? []) as PositionFormTemplateRow[];
  const { data: elements } = await supabase
    .from("position_form_template_element")
    .select("template_id");
  const countByTemplate = new Map<string, number>();
  for (const r of elements ?? []) {
    countByTemplate.set(r.template_id, (countByTemplate.get(r.template_id) ?? 0) + 1);
  }
  const { data: positions } = await supabase
    .from("position_dictionary")
    .select("id, position_code, position_name_pl, form_template_id")
    .not("form_template_id", "is", null);
  const byTemplateId = new Map<string, { id: string; position_code: string; position_name_pl: string }[]>();
  for (const p of positions ?? []) {
    const tid = (p as { form_template_id?: string }).form_template_id;
    if (tid) {
      const arr = byTemplateId.get(tid) ?? [];
      arr.push({
        id: p.id,
        position_code: p.position_code,
        position_name_pl: p.position_name_pl ?? "",
      });
      byTemplateId.set(tid, arr);
    }
  }
  return list.map((t) => ({
    ...t,
    elements_count: countByTemplate.get(t.id) ?? 0,
    assigned_positions: byTemplateId.get(t.id) ?? [],
  }));
}

/** Fetch one template by id. */
export async function fetchPositionFormTemplateById(
  id: string
): Promise<PositionFormTemplateRow | null> {
  const { data, error } = await supabase
    .from("position_form_template")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as PositionFormTemplateRow;
}

/** Create form template. */
export async function createPositionFormTemplate(
  input: Omit<PositionFormTemplateInsert, "id" | "created_at" | "updated_at">
): Promise<PositionFormTemplateRow> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("position_form_template")
    .insert({ ...input, created_at: now, updated_at: now })
    .select()
    .single();
  if (error) throw error;
  return data as PositionFormTemplateRow;
}

/** Update form template. */
export async function updatePositionFormTemplate(
  id: string,
  input: PositionFormTemplateUpdate
): Promise<PositionFormTemplateRow> {
  const { data, error } = await supabase
    .from("position_form_template")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as PositionFormTemplateRow;
}

/** Delete form template (cascade deletes items). */
export async function deletePositionFormTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("position_form_template").delete().eq("id", id);
  if (error) throw error;
}

/** Fetch template elements (headers + criteria) for editor, ordered by sort_order. */
export async function fetchPositionFormTemplateElements(
  templateId: string
): Promise<TemplateElement[]> {
  const { data: rows, error } = await supabase
    .from("position_form_template_element")
    .select("id, template_id, element_type, sort_order, header_label, evaluation_criterion_id, is_required")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  if (!rows?.length) return [];
  const criterionIds = rows
    .filter((r) => r.element_type === "criterion" && r.evaluation_criterion_id)
    .map((r) => r.evaluation_criterion_id!);
  let criteriaMap = new Map<string, { name: string; section: CriterionSection | null }>();
  if (criterionIds.length > 0) {
    const { data: criteria } = await supabase
      .from("evaluation_criteria")
      .select("id, name, section")
      .in("id", criterionIds);
    criteriaMap = new Map((criteria ?? []).map((c) => [c.id, { name: c.name, section: c.section }]));
  }
  return rows.map((r) => {
    if (r.element_type === "header") {
      return {
        type: "header" as const,
        id: r.id,
        sort_order: r.sort_order,
        header_label: r.header_label ?? "",
      };
    }
    const c = criteriaMap.get(r.evaluation_criterion_id!);
    return {
      type: "criterion" as const,
      id: r.id,
      sort_order: r.sort_order,
      evaluation_criterion_id: r.evaluation_criterion_id!,
      criterion_name: c?.name ?? "",
      criterion_section: c?.section ?? null,
      is_required: r.is_required ?? false,
    };
  });
}

/** Replace all elements of a template (delete existing, insert new). */
export async function setPositionFormTemplateElements(
  templateId: string,
  elements: (
    | { element_type: "header"; sort_order: number; header_label: string }
    | { element_type: "criterion"; sort_order: number; evaluation_criterion_id: string; is_required: boolean }
  )[]
): Promise<void> {
  const { error: delError } = await supabase
    .from("position_form_template_element")
    .delete()
    .eq("template_id", templateId);
  if (delError) throw delError;
  if (elements.length === 0) return;
  const rows = elements.map((el) =>
    el.element_type === "header"
      ? {
          template_id: templateId,
          element_type: "header" as const,
          sort_order: el.sort_order,
          header_label: el.header_label,
          evaluation_criterion_id: null,
          is_required: null,
        }
      : {
          template_id: templateId,
          element_type: "criterion" as const,
          sort_order: el.sort_order,
          header_label: null,
          evaluation_criterion_id: el.evaluation_criterion_id,
          is_required: el.is_required,
        }
  );
  const { error: insError } = await supabase.from("position_form_template_element").insert(rows);
  if (insError) throw insError;
}

/** Fetch criteria pool: all evaluation_criteria with position_code for grouping (for "add criterion" in template editor). */
export async function fetchEvaluationCriteriaPool(): Promise<EvaluationCriterionOption[]> {
  const { data: criteria, error } = await supabase
    .from("evaluation_criteria")
    .select("id, name, section, code, is_required, sort_order, position_dictionary_id")
    .order("position_dictionary_id", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const list = (criteria ?? []) as (EvaluationCriterionOption & { position_dictionary_id: string })[];
  const posIds = [...new Set(list.map((c) => c.position_dictionary_id))];
  if (posIds.length === 0) return list;
  const { data: positions } = await supabase
    .from("position_dictionary")
    .select("id, position_code")
    .in("id", posIds);
  const posById = new Map((positions ?? []).map((p) => [p.id, p.position_code]));
  return list.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
    code: c.code,
    is_required: c.is_required,
    sort_order: c.sort_order,
    position_code: posById.get(c.position_dictionary_id),
  }));
}

/** Create template from position: copy criteria from position_dictionary (by position id) into new template items. */
export async function createTemplateFromPosition(
  templateName: string,
  positionId: string
): Promise<PositionFormTemplateRow> {
  const { data: pos, error: posErr } = await supabase
    .from("position_dictionary")
    .select("id")
    .eq("id", positionId)
    .maybeSingle();
  if (posErr || !pos) throw new Error("Pozycja nie znaleziona");
  const { data: criteria, error: critErr } = await supabase
    .from("evaluation_criteria")
    .select("id, is_required, sort_order")
    .eq("position_dictionary_id", pos.id)
    .order("sort_order", { ascending: true });
  if (critErr) throw critErr;
  const template = await createPositionFormTemplate({ name: templateName, description: null });
  if (criteria?.length) {
    await setPositionFormTemplateElements(
      template.id,
      criteria.map((c, idx) => ({
        element_type: "criterion" as const,
        sort_order: idx,
        evaluation_criterion_id: c.id,
        is_required: c.is_required ?? false,
      }))
    );
  }
  return template;
}
