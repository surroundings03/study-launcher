import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('studyLauncher', {});
