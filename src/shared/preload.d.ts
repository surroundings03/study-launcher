import type {
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
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
      addUrlLaunchItem(
        workflowId: string,
        input: CreateUrlLaunchItemInput
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
