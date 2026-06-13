import ElectronStore from 'electron-store';
import { randomUUID } from 'node:crypto';
import type {
  ActiveSession,
  AppData,
  StudySession,
  Workflow
} from '../shared/types';

const DEFAULT_APP_DATA: AppData = {
  schemaVersion: 1,
  workflows: [],
  activeSession: null
};

let store: ElectronStore<AppData> | null = null;

const getStore = () => {
  store ??= new ElectronStore<AppData>({
    name: 'nodestart-data',
    defaults: DEFAULT_APP_DATA
  });

  return store;
};

const cloneDefaultAppData = (): AppData => ({
  schemaVersion: 1,
  workflows: [],
  activeSession: null
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeActiveSession = (value: unknown): ActiveSession => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.workflowId !== 'string' ||
    typeof value.startedAt !== 'string'
  ) {
    return null;
  }

  return {
    workflowId: value.workflowId,
    startedAt: value.startedAt
  };
};

const normalizeAppData = (value: unknown): AppData => {
  if (!isRecord(value)) {
    return cloneDefaultAppData();
  }

  return {
    schemaVersion: 1,
    workflows: Array.isArray(value.workflows)
      ? (value.workflows as Workflow[])
      : [],
    activeSession: normalizeActiveSession(value.activeSession)
  };
};

export const getAppData = (): AppData => {
  try {
    const data = normalizeAppData(getStore().store);
    saveAppData(data);
    return data;
  } catch (error) {
    console.warn('Failed to read app data. Falling back to defaults.', error);
    return cloneDefaultAppData();
  }
};

export const saveAppData = (data: AppData): void => {
  try {
    getStore().store = normalizeAppData(data);
  } catch (error) {
    console.warn('Failed to save app data.', error);
    throw error;
  }
};

export const getWorkflows = (): Workflow[] => getAppData().workflows;

export const saveWorkflows = (workflows: Workflow[]): void => {
  saveAppData({
    ...getAppData(),
    workflows: Array.isArray(workflows) ? workflows : []
  });
};

export const getActiveSession = (): ActiveSession => getAppData().activeSession;

export const saveActiveSession = (activeSession: ActiveSession): void => {
  saveAppData({
    ...getAppData(),
    activeSession: normalizeActiveSession(activeSession)
  });
};

const getDurationSeconds = (startedAt: string, endedAt: string): number => {
  const startedAtMs = new Date(startedAt).getTime();
  const endedAtMs = new Date(endedAt).getTime();

  if (!Number.isFinite(startedAtMs) || !Number.isFinite(endedAtMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000));
};

export const startActiveSession = (
  workflowId: string,
  startedAt = new Date().toISOString()
): AppData => {
  const data = getAppData();
  const activeSession = normalizeActiveSession({
    workflowId,
    startedAt
  });

  saveAppData({
    ...data,
    activeSession
  });

  return getAppData();
};

export const settleActiveSession = (workflowId?: string): AppData => {
  const data = getAppData();
  const activeSession = data.activeSession;

  if (!activeSession) {
    return data;
  }

  if (workflowId && activeSession.workflowId !== workflowId) {
    throw new Error('Stop the active workflow before starting another one.');
  }

  const endedAt = new Date().toISOString();
  const workflowIndex = data.workflows.findIndex(
    (workflow) => workflow.id === activeSession.workflowId
  );

  if (workflowIndex === -1) {
    saveAppData({
      ...data,
      activeSession: null
    });

    return getAppData();
  }

  const workflow = data.workflows[workflowIndex];
  const session: StudySession = {
    id: randomUUID(),
    workflowId: activeSession.workflowId,
    startedAt: activeSession.startedAt,
    endedAt,
    durationSeconds: getDurationSeconds(activeSession.startedAt, endedAt)
  };
  const nextWorkflows = [...data.workflows];

  nextWorkflows[workflowIndex] = {
    ...workflow,
    sessions: [...(Array.isArray(workflow.sessions) ? workflow.sessions : []), session],
    updatedAt: endedAt
  };

  saveAppData({
    ...data,
    workflows: nextWorkflows,
    activeSession: null
  });

  return getAppData();
};
