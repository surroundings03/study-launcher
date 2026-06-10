export type LaunchItemType = "url" | "file" | "folder" | "app";

export type LaunchItem = {
  id: string;
  title: string;
  type: LaunchItemType;
  target: string;
  enabled: boolean;
  /**
   * Launch order within the current workflow.
   *
   * Lower values come first. UI lists should display launch items in ascending
   * order, and resource launching should execute them in ascending order too.
   * New launch items should be appended to the end of the workflow's item list.
   * After deletion or reordering, future sorting logic should normalize order
   * values to avoid duplicates or gaps.
   */
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
};

export type StudySession = {
  id: string;
  workflowId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  items: LaunchItem[];
  tasks: Task[];
  sessions: StudySession[];
  createdAt: string;
  updatedAt: string;
};

export type ActiveSession = {
  workflowId: string;
  startedAt: string;
} | null;

export type AppData = {
  schemaVersion: 1;
  workflows: Workflow[];
  activeSession: ActiveSession;
};

export type CreateWorkflowInput = {
  name: string;
  description?: string;
};

export type CreateUrlLaunchItemInput = {
  title: string;
  target: string;
};
