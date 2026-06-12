import { dialog, ipcMain, shell } from 'electron';
import type { OpenDialogOptions } from 'electron';
import { randomUUID } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type {
  CreateLaunchItemInput,
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
  LaunchItem,
  LaunchItemType,
  PickPathResult,
  UpdateWorkflowInput,
  Workflow
} from '../shared/types';
import { getWorkflows, saveWorkflows } from './store';

type IpcHandler<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => TResult | Promise<TResult>;

const launchItemTypes = new Set<LaunchItemType>([
  'url',
  'file',
  'folder',
  'app'
]);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const handleIpc = <TArgs extends unknown[], TResult>(
  channel: string,
  handler: IpcHandler<TArgs, TResult>
): void => {
  ipcMain.handle(channel, async (_event, ...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  });
};

const isLaunchItemType = (value: unknown): value is LaunchItemType =>
  typeof value === 'string' && launchItemTypes.has(value as LaunchItemType);

const createWorkflow = (input: CreateWorkflowInput): Workflow => {
  const name = input.name.trim();

  if (!name) {
    throw new Error('Workflow name is required.');
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

const updateWorkflow = (
  workflow: Workflow,
  input: UpdateWorkflowInput
): Workflow => {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';

  if (!name) {
    throw new Error('Workflow name is required.');
  }

  return {
    ...workflow,
    name,
    description:
      typeof input?.description === 'string' ? input.description.trim() : '',
    updatedAt: new Date().toISOString()
  };
};

const parseHttpUrl = (target: string): string => {
  const trimmedTarget = target.trim();

  if (!trimmedTarget) {
    throw new Error('URL is required.');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedTarget);
  } catch {
    throw new Error('URL format is invalid.');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported.');
  }

  return parsedUrl.toString();
};

const getPathMissingMessage = (type: LaunchItemType): string => {
  if (type === 'folder') {
    return 'Folder does not exist or was moved.';
  }

  if (type === 'app') {
    return 'Application does not exist or was moved.';
  }

  return 'File does not exist or was moved.';
};

const validateLocalTarget = (
  type: Exclude<LaunchItemType, 'url'>,
  target: string
): string => {
  const trimmedTarget = target.trim();

  if (!trimmedTarget || !existsSync(trimmedTarget)) {
    throw new Error(getPathMissingMessage(type));
  }

  let targetStats: ReturnType<typeof statSync>;

  try {
    targetStats = statSync(trimmedTarget);
  } catch {
    throw new Error(getPathMissingMessage(type));
  }

  if (type === 'folder') {
    if (!targetStats.isDirectory()) {
      throw new Error('Selected target is not a folder.');
    }

    return trimmedTarget;
  }

  if (!targetStats.isFile()) {
    throw new Error('Selected target is not a file.');
  }

  if (type === 'app' && path.extname(trimmedTarget).toLowerCase() !== '.exe') {
    throw new Error('Only .exe applications are allowed.');
  }

  return trimmedTarget;
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

const normalizeLaunchItemOrders = (items: LaunchItem[]): LaunchItem[] =>
  [...items]
    .sort((firstItem, secondItem) => {
      if (firstItem.order !== secondItem.order) {
        return firstItem.order - secondItem.order;
      }

      return firstItem.createdAt.localeCompare(secondItem.createdAt);
    })
    .map((item, index) => ({
      ...item,
      order: index + 1
    }));

const createLaunchItem = (
  workflow: Workflow,
  input: CreateLaunchItemInput
): LaunchItem => {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const type = input?.type;

  if (!title) {
    throw new Error('Launch item title is required.');
  }

  if (!isLaunchItemType(type)) {
    throw new Error('Launch item type is invalid.');
  }

  const target =
    type === 'url'
      ? parseHttpUrl(typeof input?.target === 'string' ? input.target : '')
      : validateLocalTarget(
          type,
          typeof input?.target === 'string' ? input.target : ''
        );
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    title,
    type,
    target,
    enabled: true,
    order: getNextLaunchItemOrder(workflow),
    createdAt: now,
    updatedAt: now
  };
};

const findWorkflowIndex = (workflows: Workflow[], workflowId: string): number =>
  workflows.findIndex((workflow) => workflow.id === workflowId);

const addLaunchItemToWorkflow = (
  workflowId: string,
  input: CreateLaunchItemInput
): Workflow => {
  const workflows = getWorkflows();
  const workflowIndex = findWorkflowIndex(workflows, workflowId);

  if (workflowIndex === -1) {
    throw new Error('Workflow not found.');
  }

  const workflow = workflows[workflowIndex];
  const launchItem = createLaunchItem(workflow, input);
  const updatedWorkflow: Workflow = {
    ...workflow,
    items: [...workflow.items, launchItem],
    updatedAt: launchItem.updatedAt
  };
  const nextWorkflows = [...workflows];
  nextWorkflows[workflowIndex] = updatedWorkflow;

  saveWorkflows(nextWorkflows);

  return updatedWorkflow;
};

const getLaunchItem = (workflowId: string, launchItemId: string) => {
  const workflow = getWorkflows().find(
    (currentWorkflow) => currentWorkflow.id === workflowId
  );

  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  const launchItem = workflow.items.find((item) => item.id === launchItemId);

  if (!launchItem) {
    throw new Error('Launch item not found.');
  }

  return launchItem;
};

const launchItem = async (
  workflowId: string,
  launchItemId: string
): Promise<void> => {
  const item = getLaunchItem(workflowId, launchItemId);

  if (!item.enabled) {
    throw new Error('Launch item is disabled.');
  }

  if (item.type === 'url') {
    try {
      await shell.openExternal(parseHttpUrl(item.target));
      return;
    } catch (error) {
      throw new Error(`Unable to open URL: ${getErrorMessage(error)}`);
    }
  }

  const target = validateLocalTarget(item.type, item.target);
  const openError = await shell.openPath(target);

  if (openError) {
    throw new Error(`Unable to open launch item: ${openError}`);
  }
};

const pickPath = async (
  options: OpenDialogOptions,
  requiresExe = false
): Promise<PickPathResult> => {
  const result = await dialog.showOpenDialog(options);

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const selectedPath = result.filePaths[0];

  if (requiresExe && path.extname(selectedPath).toLowerCase() !== '.exe') {
    throw new Error('Only .exe applications are allowed.');
  }

  return {
    canceled: false,
    path: selectedPath,
    title: path.basename(selectedPath)
  };
};

export const registerWorkflowIpcHandlers = (): void => {
  handleIpc('workflows:get', () => getWorkflows());

  handleIpc('workflows:create', (input: CreateWorkflowInput) => {
    const workflow = createWorkflow(input);
    saveWorkflows([...getWorkflows(), workflow]);

    return workflow;
  });

  handleIpc(
    'workflows:update',
    (workflowId: string, input: UpdateWorkflowInput) => {
      const workflows = getWorkflows();
      const workflowIndex = findWorkflowIndex(workflows, workflowId);

      if (workflowIndex === -1) {
        throw new Error('Workflow not found.');
      }

      const nextWorkflows = [...workflows];
      const updatedWorkflow = updateWorkflow(
        nextWorkflows[workflowIndex],
        input
      );

      nextWorkflows[workflowIndex] = updatedWorkflow;
      saveWorkflows(nextWorkflows);

      return updatedWorkflow;
    }
  );

  handleIpc('workflows:delete', (workflowId: string) => {
    const workflows = getWorkflows();
    const nextWorkflows = workflows.filter(
      (workflow) => workflow.id !== workflowId
    );

    if (nextWorkflows.length === workflows.length) {
      throw new Error('Workflow not found.');
    }

    saveWorkflows(nextWorkflows);

    return nextWorkflows;
  });

  handleIpc('launch-items:pick-file', () =>
    pickPath({
      properties: ['openFile'],
      title: 'Choose file'
    })
  );

  handleIpc('launch-items:pick-folder', () =>
    pickPath({
      properties: ['openDirectory'],
      title: 'Choose folder'
    })
  );

  handleIpc('launch-items:pick-app', () =>
    pickPath(
      {
        filters: [{ name: 'Applications', extensions: ['exe'] }],
        properties: ['openFile'],
        title: 'Choose application'
      },
      true
    )
  );

  handleIpc(
    'launch-items:add',
    (workflowId: string, input: CreateLaunchItemInput) =>
      addLaunchItemToWorkflow(workflowId, input)
  );

  handleIpc(
    'launch-items:add-url',
    (workflowId: string, input: CreateUrlLaunchItemInput) =>
      addLaunchItemToWorkflow(workflowId, {
        ...input,
        type: 'url'
      })
  );

  handleIpc('launch-items:launch', launchItem);

  handleIpc(
    'launch-items:launch-url',
    (workflowId: string, launchItemId: string) => {
      const item = getLaunchItem(workflowId, launchItemId);

      if (item.type !== 'url') {
        throw new Error('Launch item is not a URL.');
      }

      return launchItem(workflowId, launchItemId);
    }
  );

  handleIpc(
    'launch-items:delete',
    (workflowId: string, launchItemId: string) => {
      const workflows = getWorkflows();
      const workflowIndex = findWorkflowIndex(workflows, workflowId);

      if (workflowIndex === -1) {
        throw new Error('Workflow not found.');
      }

      const workflow = workflows[workflowIndex];
      const nextItems = workflow.items.filter(
        (item) => item.id !== launchItemId
      );

      if (nextItems.length === workflow.items.length) {
        throw new Error('Launch item not found.');
      }

      const now = new Date().toISOString();
      const updatedWorkflow: Workflow = {
        ...workflow,
        items: normalizeLaunchItemOrders(nextItems),
        updatedAt: now
      };
      const nextWorkflows = [...workflows];
      nextWorkflows[workflowIndex] = updatedWorkflow;

      saveWorkflows(nextWorkflows);

      return updatedWorkflow;
    }
  );
};
