import { contextBridge, ipcRenderer } from 'electron';
import type {
  CreateLaunchItemInput,
  CreateUrlLaunchItemInput,
  CreateWorkflowInput,
  MoveLaunchItemDirection,
  UpdateWorkflowInput
} from './shared/types';

contextBridge.exposeInMainWorld('studyLauncher', {
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
  moveLaunchItem: (
    workflowId: string,
    launchItemId: string,
    direction: MoveLaunchItemDirection
  ) => ipcRenderer.invoke(
    'launch-items:move',
    workflowId,
    launchItemId,
    direction
  ),
  launchUrlLaunchItem: (workflowId: string, launchItemId: string) =>
    ipcRenderer.invoke('launch-items:launch-url', workflowId, launchItemId),
  deleteLaunchItem: (workflowId: string, launchItemId: string) =>
    ipcRenderer.invoke('launch-items:delete', workflowId, launchItemId)
});
