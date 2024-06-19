import { electronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    api: {
      sendCommand: (command: any, args?: any) => any;
      onCommandResult: (handler: (_: unknown, result: any) => void) => void;
      offCommandResult: (handler: (_: unknown, result: any) => void) => void;
      onLog: (handler: (_: unknown, log: any) => void) => void;
      offLog: (handler: (_: unknown, log: any) => void) => void;
      forceQuit: () => void;
    };
    nativeApi: {
      minimizeApp: () => void;
      maximizeApp: () => void;
      closeApp: () => void;
    };
  }
}
