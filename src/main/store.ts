import ElectronStore from 'electron-store';
import type { ActiveSession, AppData, Workflow } from '../shared/types';

const DEFAULT_APP_DATA: AppData = {
  schemaVersion: 1,
  workflows: [],
  activeSession: null
};

let store: ElectronStore<AppData> | null = null;

const getStore = () => {
  store ??= new ElectronStore<AppData>({
    name: 'study-launcher-data',
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
