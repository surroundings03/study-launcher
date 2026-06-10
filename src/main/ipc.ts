import { ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import type { CreateWorkflowInput, Workflow } from '../shared/types';
import { getWorkflows, saveWorkflows } from './store';

const createWorkflow = (input: CreateWorkflowInput): Workflow => {
  const name = input.name.trim();

  if (!name) {
    throw new Error('工作流名称不能为空');
  }

  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    name,
    description: input.description?.trim() ?? '',
    items: [],
    tasks: [],
    sessions: [],
    createdAt: now,
    updatedAt: now
  };
};

export const registerWorkflowIpcHandlers = (): void => {
  ipcMain.handle('workflows:get', () => getWorkflows());

  ipcMain.handle('workflows:create', (_event, input: CreateWorkflowInput) => {
    const workflow = createWorkflow(input);
    saveWorkflows([...getWorkflows(), workflow]);

    return workflow;
  });

  ipcMain.handle('workflows:delete', (_event, workflowId: string) => {
    const workflows = getWorkflows();
    const nextWorkflows = workflows.filter(
      (workflow) => workflow.id !== workflowId
    );

    if (nextWorkflows.length === workflows.length) {
      throw new Error('未找到要删除的工作流');
    }

    saveWorkflows(nextWorkflows);

    return nextWorkflows;
  });
};
