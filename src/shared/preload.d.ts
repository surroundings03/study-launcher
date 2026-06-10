import type { CreateWorkflowInput, Workflow } from './types';

declare global {
  interface Window {
    studyLauncher: {
      getWorkflows(): Promise<Workflow[]>;
      createWorkflow(input: CreateWorkflowInput): Promise<Workflow>;
      deleteWorkflow(workflowId: string): Promise<Workflow[]>;
    };
  }
}

export {};
