import { ipcMain, shell } from 'electron';
import { randomUUID } from 'node:crypto';
import type {
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
  LaunchItem,
  Workflow
} from '../shared/types';
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

const parseHttpUrl = (target: string): string => {
  const trimmedTarget = target.trim();

  if (!trimmedTarget) {
    throw new Error('URL 不能为空');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedTarget);
  } catch {
    throw new Error('URL 格式错误');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('只支持 http 和 https 协议');
  }

  return parsedUrl.toString();
};

const getNextLaunchItemOrder = (workflow: Workflow): number => {
  const maxOrder = workflow.items.reduce(
    (currentMax, item) =>
      Number.isFinite(item.order)
        ? Math.max(currentMax, item.order)
        : currentMax,
    0
  );

  return maxOrder + 1;
};

const createUrlLaunchItem = (
  workflow: Workflow,
  input: CreateUrlLaunchItemInput
): LaunchItem => {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';

  if (!title) {
    throw new Error('标题不能为空');
  }

  const target = parseHttpUrl(
    typeof input?.target === 'string' ? input.target : ''
  );
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    title,
    type: 'url',
    target,
    enabled: true,
    order: getNextLaunchItemOrder(workflow),
    createdAt: now,
    updatedAt: now
  };
};

const findWorkflowIndex = (workflows: Workflow[], workflowId: string): number =>
  workflows.findIndex((workflow) => workflow.id === workflowId);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

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

  ipcMain.handle(
    'launch-items:add-url',
    (_event, workflowId: string, input: CreateUrlLaunchItemInput) => {
      const workflows = getWorkflows();
      const workflowIndex = findWorkflowIndex(workflows, workflowId);

      if (workflowIndex === -1) {
        throw new Error('未找到当前工作流');
      }

      const workflow = workflows[workflowIndex];
      const launchItem = createUrlLaunchItem(workflow, input);
      const updatedWorkflow: Workflow = {
        ...workflow,
        items: [...workflow.items, launchItem],
        updatedAt: launchItem.updatedAt
      };
      const nextWorkflows = [...workflows];
      nextWorkflows[workflowIndex] = updatedWorkflow;

      saveWorkflows(nextWorkflows);

      return updatedWorkflow;
    }
  );

  ipcMain.handle(
    'launch-items:launch-url',
    async (_event, workflowId: string, launchItemId: string) => {
      const workflow = getWorkflows().find(
        (currentWorkflow) => currentWorkflow.id === workflowId
      );

      if (!workflow) {
        throw new Error('未找到当前工作流');
      }

      const launchItem = workflow.items.find((item) => item.id === launchItemId);

      if (!launchItem) {
        throw new Error('未找到 URL 启动项');
      }

      if (launchItem.type !== 'url') {
        throw new Error('当前只支持启动 URL 类型');
      }

      if (!launchItem.enabled) {
        throw new Error('启动项已禁用');
      }

      const target = parseHttpUrl(launchItem.target);

      try {
        await shell.openExternal(target);
      } catch (error) {
        throw new Error(`打开失败：${getErrorMessage(error)}`);
      }
    }
  );
};
