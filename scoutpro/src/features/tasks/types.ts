export type TaskType = "task" | "invitation" | "observation";

export type TaskStatus = "pending" | "completed" | "cancelled";

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  assigned_to?: string | null;
  deadline: string;
  status: TaskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;

  location?: string | null;
  meeting_date?: string | null;
  inviter_info?: string | null;

  observation_location?: string | null;
  observation_date?: string | null;
  observation_source?: string | null;
  player_ids?: string[];
  player_names?: string[];

  assigned_to_name?: string | null;
  created_by_name?: string | null;
}

export interface TaskFormData {
  type: TaskType | "";
  description: string;
  assigned_to: string;
  deadline: string;
  status?: TaskStatus;

  location: string;
  meeting_date: string;
  inviter_info: string;

  observation_location: string;
  observation_date: string;
  observation_source: string;
  selected_player_ids: string[];

  id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  task: "Zadanie",
  invitation: "Zaproszenie",
  observation: "Obserwacja",
};

export const TASK_TYPE_DESCRIPTIONS: Record<TaskType, string> = {
  task:
    "Ogólne zadania operacyjne do wykonania dla użytkownika aplikacji.",
  invitation:
    "Rejestracja zaproszeń na obserwacje z podstawowymi danymi.",
  observation:
    "Planowanie wyjazdów na mecze i treningi.",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Do realizacji",
  completed: "Zrealizowane",
  cancelled: "Anulowane",
};
