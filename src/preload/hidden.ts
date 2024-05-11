import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';

// Assuming you have a custom API for the hidden renderer to execute commands
// and to handle other background tasks. Adjust according to your actual APIs.
const hiddenApi = {
  // Function to send a command to the main process

  onCommand: (callback: (command: any) => void): void => {
    ipcRenderer.on('recv-command', (_, result) => callback(result.command));
  },
  sendLog: (log: any): void => {
    ipcRenderer.send('send-log', log);
  }
  // You can extend this API based on the tasks you expect the hidden renderer to perform
};

// Use `contextBridge` APIs to expose APIs to the hidden renderer process
// only if context isolation is enabled, otherwise just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('hiddenApi', hiddenApi);
    contextBridge.exposeInMainWorld('electron', electronAPI);
  } catch (error) {
    console.error('Error exposing hiddenApi:', error);
  }
} else {
  // @ts-ignore (define in dts)
  window.hiddenApi = hiddenApi;
}

console.log('Preload script for hidden renderer loaded, APIs exposed.');
