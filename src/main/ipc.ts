import { dialog, ipcMain, shell } from 'electron';
import type { OpenDialogOptions } from 'electron';
import { randomUUID } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type {
  AppData,
  CreateLaunchItemInput,
  CreateTaskInput,
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
  LaunchItem,
  LaunchResult,
  LaunchWorkflowResult,
  LaunchItemType,
  PickPathResult,
  Task,
  UpdateWorkflowInput,
  Workflow
} from '../shared/types';
import {
  getActiveSession,
  getAppData,
  saveActiveSession,
  saveWorkflows,
  settleActiveSession,
  startActiveSession,
  getWorkflows
} from './store';

type IpcHandler<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => TResult | Promise<TResult>;

const launchItemTypes = new Set<LaunchItemType>([
  'url',
  'file',
  'folder',
  'app'
]);

const LAUNCH_ITEM_DELAY_MS = 1000;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

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

const assignLaunchItemOrders = (items: LaunchItem[]): LaunchItem[] =>
  items.map((item, index) => ({
    ...item,
    order: index + 1
  }));

const didLaunchItemOrderChange = (
  currentItems: LaunchItem[],
  normalizedItems: LaunchItem[]
): boolean =>
  currentItems.length !== normalizedItems.length ||
  currentItems.some((item, index) => {
    const normalizedItem = normalizedItems[index];

    return !normalizedItem || item.id !== normalizedItem.id || item.order !== normalizedItem.order;
  });

const normalizeWorkflowLaunchItemOrders = (workflow: Workflow): Workflow => {
  const normalizedItems = normalizeLaunchItemOrders(workflow.items);

  if (!didLaunchItemOrderChange(workflow.items, normalizedItems)) {
    return workflow;
  }

  return {
    ...workflow,
    items: normalizedItems
  };
};

const getNormalizedWorkflows = (): Workflow[] => {
  const workflows = getWorkflows();
  const normalizedWorkflows = workflows.map(normalizeWorkflowLaunchItemOrders);
  const didNormalize = workflows.some(
    (workflow, index) => workflow !== normalizedWorkflows[index]
  );

  if (didNormalize) {
    saveWorkflows(normalizedWorkflows);
  }

  return normalizedWorkflows;
};

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

const getWorkflowTasks = (workflow: Workflow): Task[] =>
  Array.isArray(workflow.tasks) ? workflow.tasks : [];

const createTask = (input: CreateTaskInput): Task => {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';

  if (!title) {
    throw new Error('Task title is required.');
  }

  return {
    id: randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString()
  };
};

const addTaskToWorkflow = (
  workflowId: string,
  input: CreateTaskInput
): Workflow => {
  const workflows = getNormalizedWorkflows();
  const workflowIndex = findWorkflowIndex(workflows, workflowId);

  if (workflowIndex === -1) {
    throw new Error('Workflow not found.');
  }

  const workflow = workflows[workflowIndex];
  const task = createTask(input);
  const updatedWorkflow: Workflow = {
    ...workflow,
    tasks: [...getWorkflowTasks(workflow), task],
    updatedAt: task.createdAt
  };
  const nextWorkflows = [...workflows];

  nextWorkflows[workflowIndex] = updatedWorkflow;
  saveWorkflows(nextWorkflows);

  return updatedWorkflow;
};

const setTaskCompletedInWorkflow = (
  workflowId: string,
  taskId: string,
  completed: boolean
): Workflow => {
  if (typeof completed !== 'boolean') {
    throw new Error('Task completed state is invalid.');
  }

  const workflows = getNormalizedWorkflows();
  const workflowIndex = findWorkflowIndex(workflows, workflowId);

  if (workflowIndex === -1) {
    throw new Error('Workflow not found.');
  }

  const workflow = workflows[workflowIndex];
  const tasks = getWorkflowTasks(workflow);

  if (!tasks.some((task) => task.id === taskId)) {
    throw new Error('Task not found.');
  }

  const now = new Date().toISOString();
  const updatedTasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    if (completed) {
      return {
        ...task,
        completed: true,
        completedAt: now
      };
    }

    const { completedAt: _completedAt, ...taskWithoutCompletedAt } = task;

    return {
      ...taskWithoutCompletedAt,
      completed: false
    };
  });
  const updatedWorkflow: Workflow = {
    ...workflow,
    tasks: updatedTasks,
    updatedAt: now
  };
  const nextWorkflows = [...workflows];

  nextWorkflows[workflowIndex] = updatedWorkflow;
  saveWorkflows(nextWorkflows);

  return updatedWorkflow;
};

const deleteTaskFromWorkflow = (
  workflowId: string,
  taskId: string
): Workflow => {
  const workflows = getNormalizedWorkflows();
  const workflowIndex = findWorkflowIndex(workflows, workflowId);

  if (workflowIndex === -1) {
    throw new Error('Workflow not found.');
  }

  const workflow = workflows[workflowIndex];
  const tasks = getWorkflowTasks(workflow);
  const nextTasks = tasks.filter((task) => task.id !== taskId);

  if (nextTasks.length === tasks.length) {
    throw new Error('Task not found.');
  }

  const now = new Date().toISOString();
  const updatedWorkflow: Workflow = {
    ...workflow,
    tasks: nextTasks,
    updatedAt: now
  };
  const nextWorkflows = [...workflows];

  nextWorkflows[workflowIndex] = updatedWorkflow;
  saveWorkflows(nextWorkflows);

  return updatedWorkflow;
};

const addLaunchItemToWorkflow = (
  workflowId: string,
  input: CreateLaunchItemInput
): Workflow => {
  const workflows = getNormalizedWorkflows();
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
  const workflow = getNormalizedWorkflows().find(
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

const reorderLaunchItemsInWorkflow = (
  workflowId: string,
  orderedLaunchItemIds: string[]
): Workflow => {
  if (!Array.isArray(orderedLaunchItemIds)) {
    throw new Error('Launch item order is invalid.');
  }

  const workflows = getNormalizedWorkflows();
  const workflowIndex = findWorkflowIndex(workflows, workflowId);

  if (workflowIndex === -1) {
    throw new Error('Workflow not found.');
  }

  const workflow = workflows[workflowIndex];
  const orderedItems = normalizeLaunchItemOrders(workflow.items);
  const knownItemIds = new Set(orderedItems.map((item) => item.id));
  const requestedItemIds = new Set<string>();

  if (orderedLaunchItemIds.length !== orderedItems.length) {
    throw new Error('Launch item order is incomplete.');
  }

  for (const itemId of orderedLaunchItemIds) {
    if (typeof itemId !== 'string' || !itemId) {
      throw new Error('Launch item order is invalid.');
    }

    if (requestedItemIds.has(itemId)) {
      throw new Error('Launch item order contains duplicate items.');
    }

    if (!knownItemIds.has(itemId)) {
      throw new Error(
        'Launch item order contains an item outside this workflow.'
      );
    }

    requestedItemIds.add(itemId);
  }

  if (requestedItemIds.size !== knownItemIds.size) {
    throw new Error('Launch item order is incomplete.');
  }

  const itemById = new Map(orderedItems.map((item) => [item.id, item]));
  const nextItems = orderedLaunchItemIds.map((itemId) => {
    const item = itemById.get(itemId);

    if (!item) {
      throw new Error('Launch item not found.');
    }

    return item;
  });
  const normalizedItems = assignLaunchItemOrders(nextItems);

  if (!didLaunchItemOrderChange(workflow.items, normalizedItems)) {
    return {
      ...workflow,
      items: normalizedItems
    };
  }

  const now = new Date().toISOString();
  const updatedWorkflow: Workflow = {
    ...workflow,
    items: normalizedItems,
    updatedAt: now
  };
  const nextWorkflows = [...workflows];
  nextWorkflows[workflowIndex] = updatedWorkflow;

  saveWorkflows(nextWorkflows);

  return updatedWorkflow;
};

const setLaunchItemEnabledInWorkflow = (
  workflowId: string,
  launchItemId: string,
  enabled: boolean
): Workflow => {
  if (typeof enabled !== 'boolean') {
    throw new Error('Launch item enabled state is invalid.');
  }

  const workflows = getNormalizedWorkflows();
  const workflowIndex = findWorkflowIndex(workflows, workflowId);

  if (workflowIndex === -1) {
    throw new Error('Workflow not found.');
  }

  const workflow = workflows[workflowIndex];

  if (!workflow.items.some((item) => item.id === launchItemId)) {
    throw new Error('Launch item not found.');
  }

  const now = new Date().toISOString();
  const updatedWorkflow: Workflow = {
    ...workflow,
    items: workflow.items.map((item) =>
      item.id === launchItemId
        ? {
            ...item,
            enabled,
            updatedAt: now
          }
        : item
    ),
    updatedAt: now
  };
  const nextWorkflows = [...workflows];
  nextWorkflows[workflowIndex] = updatedWorkflow;

  saveWorkflows(nextWorkflows);

  return updatedWorkflow;
};

const openLaunchItem = async (item: LaunchItem): Promise<void> => {
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

const launchItem = async (
  workflowId: string,
  launchItemId: string
): Promise<void> => {
  const item = getLaunchItem(workflowId, launchItemId);

  await openLaunchItem(item);
};

const launchWorkflow = async (
  workflowId: string
): Promise<LaunchWorkflowResult> => {
  const activeSession = getActiveSession();

  if (activeSession) {
    if (activeSession.workflowId === workflowId) {
      return {
        launchResults: [],
        started: true,
        activeSession,
        message: 'Study session is already running.'
      };
    }

    return {
      launchResults: [],
      started: false,
      activeSession,
      message: 'Stop the active workflow before starting another one.'
    };
  }

  const workflow = getNormalizedWorkflows().find(
    (currentWorkflow) => currentWorkflow.id === workflowId
  );

  if (!workflow) {
    throw new Error('Workflow not found.');
  }

  if (workflow.items.length === 0) {
    return {
      launchResults: [],
      started: false,
      message: 'No enabled launch items.'
    };
  }

  const enabledLaunchItems = normalizeLaunchItemOrders(workflow.items).filter(
    (item) => item.enabled
  );

  if (enabledLaunchItems.length === 0) {
    return {
      launchResults: [],
      started: false,
      message: 'No enabled launch items.'
    };
  }

  const launchResults: LaunchResult[] = [];

  for (let index = 0; index < enabledLaunchItems.length; index += 1) {
    const item = enabledLaunchItems[index];

    try {
      await openLaunchItem(item);
      launchResults.push({
        title: item.title,
        type: item.type,
        target: item.target,
        order: item.order,
        success: true,
        errorMessage: ''
      });
    } catch (error) {
      launchResults.push({
        title: item.title,
        type: item.type,
        target: item.target,
        order: item.order,
        success: false,
        errorMessage: getErrorMessage(error)
      });
    }

    if (index < enabledLaunchItems.length - 1) {
      await wait(LAUNCH_ITEM_DELAY_MS);
    }
  }

  const started = launchResults.some((result) => result.success);
  const nextActiveSession = started
    ? startActiveSession(workflowId).activeSession
    : null;

  return {
    launchResults,
    started,
    activeSession: nextActiveSession,
    message: started
      ? undefined
      : 'Unable to open any enabled launch items.'
  };
};

const getNormalizedAppData = (): AppData => {
  getNormalizedWorkflows();

  return getAppData();
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
  handleIpc('workflows:get', () => getNormalizedWorkflows());

  handleIpc('app-data:get', getNormalizedAppData);

  handleIpc('workflows:create', (input: CreateWorkflowInput) => {
    const workflow = createWorkflow(input);
    saveWorkflows([...getWorkflows(), workflow]);

    return workflow;
  });

  handleIpc(
    'workflows:update',
    (workflowId: string, input: UpdateWorkflowInput) => {
      const workflows = getNormalizedWorkflows();
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
    const workflows = getNormalizedWorkflows();
    const nextWorkflows = workflows.filter(
      (workflow) => workflow.id !== workflowId
    );

    if (nextWorkflows.length === workflows.length) {
      throw new Error('Workflow not found.');
    }

    saveWorkflows(nextWorkflows);

    const activeSession = getActiveSession();

    if (activeSession?.workflowId === workflowId) {
      saveActiveSession(null);
    }

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

  handleIpc('workflows:launch', launchWorkflow);

  handleIpc('study-session:stop', (workflowId: string) =>
    settleActiveSession(workflowId)
  );

  handleIpc(
    'launch-items:reorder',
    (workflowId: string, orderedLaunchItemIds: string[]) =>
      reorderLaunchItemsInWorkflow(workflowId, orderedLaunchItemIds)
  );

  handleIpc(
    'launch-items:set-enabled',
    (workflowId: string, launchItemId: string, enabled: boolean) =>
      setLaunchItemEnabledInWorkflow(workflowId, launchItemId, enabled)
  );

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
      const workflows = getNormalizedWorkflows();
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

  handleIpc('tasks:add', (workflowId: string, input: CreateTaskInput) =>
    addTaskToWorkflow(workflowId, input)
  );

  handleIpc(
    'tasks:set-completed',
    (workflowId: string, taskId: string, completed: boolean) =>
      setTaskCompletedInWorkflow(workflowId, taskId, completed)
  );

  handleIpc('tasks:delete', (workflowId: string, taskId: string) =>
    deleteTaskFromWorkflow(workflowId, taskId)
  );
};
