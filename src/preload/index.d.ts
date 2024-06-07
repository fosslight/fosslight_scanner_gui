import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    api: {
      sendCommand: (command: Command, args?: any) => any;
      onCommandResult: (handler: (_: unknown, result: any) => void) => void;
      offCommandResult: (handler: (_: unknown, result: any) => void) => void;
      onLog: (handler: (_: unknown, log: any) => void) => void;
      offLog: (handler: (_: unknown, log: any) => void) => void;
    };
    nativeApi: {
      minimizeApp: () => void;
      maximizeApp: () => void;
      closeApp: () => void;
    };
  }
}
