import { contextBridge, ipcRenderer } from 'electron'
import type { GuiResult, RecentScan, ScanConfig, ScanEvent } from '../shared/types'

const api = {
  startScan: (cfg: ScanConfig): Promise<{ ok: boolean; message?: string }> =>
    ipcRenderer.invoke('scan:start', cfg),
  cancelScan: (): Promise<{ ok: boolean }> => ipcRenderer.invoke('scan:cancel'),
  isScanRunning: (): Promise<boolean> => ipcRenderer.invoke('scan:isRunning'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  onScanEvent: (cb: (e: ScanEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, e: ScanEvent): void => cb(e)
    ipcRenderer.on('scan:event', listener)
    return () => ipcRenderer.removeListener('scan:event', listener)
  },
  loadReport: (resultFile?: string): Promise<GuiResult | null> =>
    ipcRenderer.invoke('report:load', resultFile),
  getRecentScans: (): Promise<RecentScan[]> => ipcRenderer.invoke('report:recent'),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectDir'),
  selectArchive: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectArchive'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  showInFolder: (path: string): Promise<void> => ipcRenderer.invoke('shell:showInFolder', path)
}

export type Api = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
