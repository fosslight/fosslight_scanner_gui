import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      sendCommand: (command: Command, args?: any) => void;
    };
    fosslightApi: unknown;
  }
}
