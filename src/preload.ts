import { contextBridge, ipcRenderer } from 'electron';
import type { CreateWorkflowInput } from './shared/types';

contextBridge.exposeInMainWorld('studyLauncher', {
  getWorkflows: () => ipcRenderer.invoke('workflows:get'),
  createWorkflow: (input: CreateWorkflowInput) =>
    ipcRenderer.invoke('workflows:create', input),
  deleteWorkflow: (workflowId: string) =>
    ipcRenderer.invoke('workflows:delete', workflowId)
});
