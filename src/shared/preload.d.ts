import type {
  CreateLaunchItemInput,
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
  MoveLaunchItemDirection,
  PickPathResult,
  UpdateWorkflowInput,
  Workflow
} from './types';

declare global {
  interface Window {
    studyLauncher: {
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
      moveLaunchItem(
        workflowId: string,
        launchItemId: string,
        direction: MoveLaunchItemDirection
      ): Promise<Workflow>;
      launchUrlLaunchItem(
        workflowId: string,
        launchItemId: string
      ): Promise<void>;
      deleteLaunchItem(
        workflowId: string,
        launchItemId: string
      ): Promise<Workflow>;
    };
  }
}

export {};
