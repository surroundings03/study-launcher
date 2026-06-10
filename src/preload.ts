import { contextBridge, ipcRenderer } from 'electron';
import type {
  CreateUrlLaunchItemInput,
  CreateWorkflowInput
} from './shared/types';

contextBridge.exposeInMainWorld('studyLauncher', {
  getWorkflows: () => ipcRenderer.invoke('workflows:get'),
  createWorkflow: (input: CreateWorkflowInput) =>
    ipcRenderer.invoke('workflows:create', input),
  deleteWorkflow: (workflowId: string) =>
    ipcRenderer.invoke('workflows:delete', workflowId),
  addUrlLaunchItem: (workflowId: string, input: CreateUrlLaunchItemInput) =>
    ipcRenderer.invoke('launch-items:add-url', workflowId, input),
  launchUrlLaunchItem: (workflowId: string, launchItemId: string) =>
    ipcRenderer.invoke('launch-items:launch-url', workflowId, launchItemId)
});
