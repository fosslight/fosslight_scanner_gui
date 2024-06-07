import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    api: {
      sendCommand: (command: Command, args?: any) => any;
      onCommandResult: (callback: (result: any) => void) => void;
      onLog: (callback: (log: any) => void) => void;
      removeCommandResultListener: (callback: (result: any) => void) => void;
      removeLogListener: (callback: (log: any) => void) => void;
    };
    nativeApi: {
      minimizeApp: () => void;
      maximizeApp: () => void;
      closeApp: () => void;
    };
  }
}
