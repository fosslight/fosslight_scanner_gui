import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      sendCommand: (command: Command, args?: any) => any;
      onCommandResult: (callback: (result: any) => void) => void;
      onLog: (callback: (log: any) => void) => void;
    };
    hiddenApi: {
      onCommand: (callback: (command: any) => void) => void;
      sendCommandResult: (result: any) => void;
      sendLog: (log: any) => void;
    };
  }
}
