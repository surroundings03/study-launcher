import type {
  AppData,
  CreateLaunchItemInput,
  CreateTaskInput,
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
  LaunchWorkflowResult,
  PickPathResult,
  UpdateWorkflowInput,
  Workflow
} from './types';

declare global {
  interface Window {
    nodeStart: {
      getAppData(): Promise<AppData>;
      getWorkflows(): Promise<Workflow[]>;
      createWorkflow(input: CreateWorkflowInput): Promise<Workflow>;
      updateWorkflow(
        workflowId: string,
        input: UpdateWorkflowInput
      ): Promise<Workflow>;
      deleteWorkflow(workflowId: string): Promise<Workflow[]>;
      pickFile(): Promise<PickPathResult>;
      pickFolder(): Promise<PickPathResult>;
      pickApp(): Promise<PickPathResult>;
      addLaunchItem(
        workflowId: string,
        input: CreateLaunchItemInput
      ): Promise<Workflow>;
      addUrlLaunchItem(
        workflowId: string,
        input: CreateUrlLaunchItemInput
      ): Promise<Workflow>;
      launchLaunchItem(
        workflowId: string,
        launchItemId: string
      ): Promise<void>;
      launchWorkflow(workflowId: string): Promise<LaunchWorkflowResult>;
      stopActiveSession(workflowId: string): Promise<AppData>;
      reorderLaunchItems(
        workflowId: string,
        orderedLaunchItemIds: string[]
      ): Promise<Workflow>;
      launchUrlLaunchItem(
        workflowId: string,
        launchItemId: string
      ): Promise<void>;
      deleteLaunchItem(
        workflowId: string,
        launchItemId: string
      ): Promise<Workflow>;
      addTask(workflowId: string, input: CreateTaskInput): Promise<Workflow>;
      setTaskCompleted(
        workflowId: string,
        taskId: string,
        completed: boolean
      ): Promise<Workflow>;
      deleteTask(workflowId: string, taskId: string): Promise<Workflow>;
    };
  }
}

export {};
