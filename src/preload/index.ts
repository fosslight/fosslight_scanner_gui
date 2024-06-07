import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  // Function to send a command to the main process
  sendCommand: (command: any): void => {
    ipcRenderer.send('send-command', { command });
  },
  // Function to add a listener for command results
  onCommandResult: (handler: (result: any) => void): void => {
    ipcRenderer.on('recv-command-result', (_, result) => handler(result));
  },
  // Function to remove the listener for command results
  removeCommandResultListener: (handler: (result: any) => void): void => {
    ipcRenderer.removeListener('recv-command-result', (_, result) => handler(result));
  },
  // Function to add a listener for logs
  onLog: (handler: (log: any) => void): void => {
    ipcRenderer.on('recv-log', (_, log) => handler(log));
  },
  // Function to remove the listener for logs
  removeLogListener: (handler: (log: any) => void): void => {
    ipcRenderer.removeListener('recv-log', (_, log) => handler(log));
  }
};

// Native APIs for renderer
const nativeApi = {
  // Function to minimize the app window
  minimizeApp: (): void => {
    ipcRenderer.send('minimizeApp');
  },
  // Function to maximize the app window
  maximizeApp: (): void => {
    ipcRenderer.send('maximizeApp');
  },
  // Function to close the app window
  closeApp: (): void => {
    ipcRenderer.send('closeApp');
  }
};
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('nativeApi', nativeApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api;
  // @ts-ignore (define in dts)
  window.nativeApi = nativeApi;
}
