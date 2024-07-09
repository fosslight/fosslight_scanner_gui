import { contextBridge, ipcRenderer } from 'electron';

// Custom APIs for renderer
const api = {
  // Function to send a command to the main process
  sendCommand: (command: Command): void => {
    ipcRenderer.send('send-command', { command });
  },
  // Function to add a listener for command results
  onCommandResult: (handler: (_: unknown, result: any) => void): void => {
    ipcRenderer.on('recv-command-result', handler);
  },
  // Function to remove the listener for command results
  offCommandResult: (handler: (_: unknown, result: any) => void): void => {
    ipcRenderer.off('recv-command-result', handler);
  },
  // Function to add a listener for logs
  onLog: (handler: (_: unknown, log: any) => void): void => {
    ipcRenderer.on('recv-log', handler);
  },
  // Function to remove the listener for logs
  offLog: (handler: (_: unknown, log: any) => void): void => {
    ipcRenderer.off('recv-log', handler);
  },
  // Function to force quit the scan
  forceQuit: (): void => {
    ipcRenderer.send('force-quit');
  },
  // Function to add a listener for app ready
  onAppReady: (handler: () => void): void => {
    ipcRenderer.on('app-ready', handler);
  },
  // Function to remove the listener for app ready
  offAppReady: (handler: () => void): void => {
    ipcRenderer.off('app-ready', handler);
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
    ipcRenderer.send('force-quit');
    ipcRenderer.send('closeApp');
  },
  openFileExplorer: (filePath: string): void => {
    ipcRenderer.send('open-file-explorer', filePath);
  },
  openFileSelector: (callback: (filePath: string) => void): void => {
    ipcRenderer.invoke('open-file-selector').then(callback);
  },
  openDirSelector: (callback: (dirPath: string) => void): void => {
    ipcRenderer.invoke('open-dir-selector').then(callback);
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
