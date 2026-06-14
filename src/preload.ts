import { contextBridge, ipcRenderer } from 'electron';
import type {
  CreateLaunchItemInput,
  CreateTaskInput,
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
  UpdateWorkflowInput
} from './shared/types';

contextBridge.exposeInMainWorld('nodeStart', {
  getAppData: () => ipcRenderer.invoke('app-data:get'),
  getWorkflows: () => ipcRenderer.invoke('workflows:get'),
  createWorkflow: (input: CreateWorkflowInput) =>
    ipcRenderer.invoke('workflows:create', input),
  updateWorkflow: (workflowId: string, input: UpdateWorkflowInput) =>
    ipcRenderer.invoke('workflows:update', workflowId, input),
  deleteWorkflow: (workflowId: string) =>
    ipcRenderer.invoke('workflows:delete', workflowId),
  pickFile: () => ipcRenderer.invoke('launch-items:pick-file'),
  pickFolder: () => ipcRenderer.invoke('launch-items:pick-folder'),
  pickApp: () => ipcRenderer.invoke('launch-items:pick-app'),
  addLaunchItem: (workflowId: string, input: CreateLaunchItemInput) =>
    ipcRenderer.invoke('launch-items:add', workflowId, input),
  addUrlLaunchItem: (workflowId: string, input: CreateUrlLaunchItemInput) =>
    ipcRenderer.invoke('launch-items:add-url', workflowId, input),
  launchLaunchItem: (workflowId: string, launchItemId: string) =>
    ipcRenderer.invoke('launch-items:launch', workflowId, launchItemId),
  launchWorkflow: (workflowId: string) =>
    ipcRenderer.invoke('workflows:launch', workflowId),
  stopActiveSession: (workflowId: string) =>
    ipcRenderer.invoke('study-session:stop', workflowId),
  reorderLaunchItems: (
    workflowId: string,
    orderedLaunchItemIds: string[]
  ) =>
    ipcRenderer.invoke(
      'launch-items:reorder',
      workflowId,
      orderedLaunchItemIds
    ),
  setLaunchItemEnabled: (
    workflowId: string,
    launchItemId: string,
    enabled: boolean
  ) =>
    ipcRenderer.invoke(
      'launch-items:set-enabled',
      workflowId,
      launchItemId,
      enabled
    ),
  launchUrlLaunchItem: (workflowId: string, launchItemId: string) =>
    ipcRenderer.invoke('launch-items:launch-url', workflowId, launchItemId),
  deleteLaunchItem: (workflowId: string, launchItemId: string) =>
    ipcRenderer.invoke('launch-items:delete', workflowId, launchItemId),
  addTask: (workflowId: string, input: CreateTaskInput) =>
    ipcRenderer.invoke('tasks:add', workflowId, input),
  setTaskCompleted: (
    workflowId: string,
    taskId: string,
    completed: boolean
  ) => ipcRenderer.invoke('tasks:set-completed', workflowId, taskId, completed),
  deleteTask: (workflowId: string, taskId: string) =>
    ipcRenderer.invoke('tasks:delete', workflowId, taskId)
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  close: () => ipcRenderer.invoke('window:close')
});
