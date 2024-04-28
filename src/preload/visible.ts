import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  // Function to send a command to the main process
  sendCommand: (command: any): void => {
    ipcRenderer.send('send-command', { command });
  },
  onCommandResult: (callback: (result: any) => void): void => {
    ipcRenderer.on('recv-command-result', (_, result) => callback(result));
  },
  onLog: (callback: (log: any) => void): void => {
    ipcRenderer.on('recv-log', (_, log) => callback(log));
  }
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
