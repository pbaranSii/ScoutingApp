import { supabase } from "@/lib/supabase";
import type { Task, TaskStatus, TaskType } from "../types";

type TaskRow = {
  id: string;
  type: TaskType;
  description: string;
  assigned_to: string | null;
  deadline: string;
  status: TaskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  location: string | null;
  meeting_date: string | null;
  inviter_info: string | null;
  observation_location: string | null;
  observation_date: string | null;
  observation_source: string | null;
  task_players?: {
    player_id: string;
    player?: { first_name: string; last_name: string } | null;
    players?: { first_name: string; last_name: string } | null;
  }[];
};

function mapRowToTask(row: TaskRow): Task {
  const player_ids =
    row.task_players?.map((tp) => tp.player_id).filter(Boolean) ?? [];
  const player_names =
    row.task_players
      ?.map((tp) => {
        const p = tp.player ?? tp.players;
        return p ? `${p.first_name} ${p.last_name}`.trim() : null;
      })
      .filter((n): n is string => Boolean(n)) ?? [];
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    assigned_to: row.assigned_to,
    deadline: row.deadline,
    status: (row.status ?? "pending") as TaskStatus,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    location: row.location,
    meeting_date: row.meeting_date,
    inviter_info: row.inviter_info,
    observation_location: row.observation_location,
    observation_date: row.observation_date,
    observation_source: row.observation_source,
    player_ids: player_ids.length ? player_ids : undefined,
    player_names: player_names.length ? player_names : undefined,
  };
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      task_players(player_id, player:players(first_name, last_name))
    `
    )
    .order("deadline", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRowToTask);
}

export async function fetchTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      task_players(player_id, player:players(first_name, last_name))
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRowToTask(data as TaskRow);
}

export type CreateTaskPayload = {
  type: TaskType;
  description: string;
  assigned_to?: string | null;
  deadline: string;
  created_by: string;
  status?: TaskStatus;
  location?: string | null;
  meeting_date?: string | null;
  inviter_info?: string | null;
  observation_location?: string | null;
  observation_date?: string | null;
  observation_source?: string | null;
  player_ids?: string[];
};

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const {
    player_ids,
    created_by,
    type,
    description,
    assigned_to,
    deadline,
    location,
    meeting_date,
    inviter_info,
    observation_location,
    observation_date,
    observation_source,
  } = payload;

  const resolvedDeadline =
    deadline?.trim() ||
    (type === "invitation" && meeting_date
      ? meeting_date.slice(0, 10)
      : undefined) ||
    new Date().toISOString().slice(0, 10);

  const insertRow: Record<string, unknown> = {
    type,
    description,
    assigned_to: assigned_to || null,
    deadline: resolvedDeadline,
    created_by,
    ...(type === "invitation" && {
      location: location ?? null,
      meeting_date: meeting_date ?? null,
      inviter_info: inviter_info ?? null,
    }),
    ...(type === "observation" && {
      observation_location: observation_location ?? null,
      observation_date: observation_date ?? null,
      observation_source: observation_source ?? null,
    }),
  };
  // Only send status if payload has it; DB default is 'pending' when column exists
  if (payload.status != null) insertRow.status = payload.status;

  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .insert(insertRow)
    .select("id")
    .single();

  if (taskError) throw taskError;
  const taskId = (taskData as { id: string }).id;

  if (type === "observation" && player_ids?.length) {
    const { error: relError } = await supabase.from("task_players").insert(
      player_ids.map((player_id) => ({ task_id: taskId, player_id }))
    );
    if (relError) throw relError;
  }

  const created = await fetchTask(taskId);
  if (!created) throw new Error("Task created but fetch failed");
  return created;
}

export type UpdateTaskPayload = {
  description?: string;
  assigned_to?: string | null;
  deadline?: string;
  status?: TaskStatus;
  location?: string | null;
  meeting_date?: string | null;
  inviter_info?: string | null;
  observation_location?: string | null;
  observation_date?: string | null;
  observation_source?: string | null;
  player_ids?: string[];
};

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload
): Promise<Task> {
  const { player_ids, ...rest } = payload;

  const { data: existing } = await supabase
    .from("tasks")
    .select("type")
    .eq("id", id)
    .single();

  const updatePayload: Record<string, unknown> = {
    ...rest,
    updated_at: new Date().toISOString(),
  };
  if (
    (updatePayload.deadline as string) === "" &&
    (existing as { type: TaskType } | null)?.type === "invitation"
  ) {
    updatePayload.deadline =
      (rest.meeting_date?.slice(0, 10) as string) ||
      new Date().toISOString().slice(0, 10);
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) throw updateError;

  if ((existing as { type: TaskType } | null)?.type === "observation") {
    await supabase.from("task_players").delete().eq("task_id", id);
    if (player_ids?.length) {
      const { error: insError } = await supabase.from("task_players").insert(
        player_ids.map((player_id) => ({ task_id: id, player_id }))
      );
      if (insError) throw insError;
    }
  }

  const updated = await fetchTask(id);
  if (!updated) throw new Error("Task updated but fetch failed");
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
