import { contextBridge, ipcRenderer } from 'electron';

// Assuming you have a custom API for the hidden renderer to execute commands
// and to handle other background tasks. Adjust according to your actual APIs.
const fosslightApi = {
  // Function to send a command to the main process

  // executeCommand: (command: string, args: any): void => {
  //   ipcRenderer.on('execute-command', { command, args });
  // },

  // Listen for command execution results from the main process
  onCommandResult: (callback: (result: any) => void): void => {
    ipcRenderer.on('command-result', (_, result) => callback(result));
  }
  // You can extend this API based on the tasks you expect the hidden renderer to perform
};

// Use `contextBridge` APIs to expose APIs to the hidden renderer process
// only if context isolation is enabled, otherwise just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('fosslightApi', fosslightApi);
  } catch (error) {
    console.error('Error exposing fosslightApi:', error);
  }
} else {
  // @ts-ignore (define in dts)
  window.fosslightApi = fosslightApi;
}
