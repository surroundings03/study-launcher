import { app, BrowserWindow, ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import squirrelStartup from 'electron-squirrel-startup';
import path from 'node:path';
import { registerWorkflowIpcHandlers } from './main/ipc';
import { getAppData, settleActiveSession } from './main/store';

if (squirrelStartup) {
  app.quit();
}

const getSenderWindow = (event: IpcMainInvokeEvent) =>
  BrowserWindow.fromWebContents(event.sender);

const registerWindowControlHandlers = () => {
  ipcMain.handle('window:minimize', (event) => {
    getSenderWindow(event)?.minimize();
  });

  ipcMain.handle('window:toggle-maximize', (event) => {
    const currentWindow = getSenderWindow(event);

    if (!currentWindow) {
      return;
    }

    if (currentWindow.isMaximized()) {
      currentWindow.unmaximize();
      return;
    }

    currentWindow.maximize();
  });

  ipcMain.handle('window:close', (event) => {
    getSenderWindow(event)?.close();
  });
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    title: 'nodeStart',
    width: 1180,
    height: 720,
    minWidth: 1024,
    minHeight: 640,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

app.whenReady().then(() => {
  getAppData();
  registerWindowControlHandlers();
  registerWorkflowIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  try {
    settleActiveSession();
  } catch (error) {
    console.warn('Failed to settle active study session before quit.', error);
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
