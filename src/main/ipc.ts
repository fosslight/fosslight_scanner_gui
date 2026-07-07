import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { execFile } from 'child_process'
import { basename, join } from 'path'
import { startScan, cancelScan, isScanRunning, backendCommand } from './scanRunner'
import { checkMissingTools, installTools, cancelInstall, getFreshPath } from './depInstaller'
import { addRecentScan, getRecentScans, loadReport } from './reportStore'
import type { ScanConfig, ScanEvent } from '../shared/types'

// 도구 설치 단계까지 포함한 스캔 세션 상태 (동시 실행 방지)
let scanSessionActive = false
let sessionCancelled = false

export function registerIpcHandlers(): void {
  ipcMain.handle('scan:start', async (event, cfg: ScanConfig) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { ok: false, message: '창을 찾을 수 없습니다' }
    if (scanSessionActive) return { ok: false, message: '이미 스캔이 실행 중입니다' }
    scanSessionActive = true
    sessionCancelled = false

    const send = (e: ScanEvent): void => {
      if (e.type === 'result') {
        addRecentScan({
          date: new Date().toISOString(),
          analyzedPath: cfg.target,
          resultFile: e.resultFile
        })
      }
      if (e.type === 'done') scanSessionActive = false
      if (!win.isDestroyed()) win.webContents.send('scan:event', e)
    }

    let pathEnv = await getFreshPath()

    // 폴더 대상이면 의존성 분석에 필요한 도구를 확인하고 없으면 자동 설치
    // (압축파일/URL은 해제 전까지 manifest를 알 수 없어 백엔드 경고로 안내)
    if (cfg.targetType === 'folder' && cfg.modes.includes('dependency')) {
      const missing = await checkMissingTools(cfg.target, pathEnv)
      if (missing.length > 0 && !sessionCancelled) {
        send({ type: 'phase', phase: 'installing' })
        send({
          type: 'log',
          level: 'INFO',
          message: `의존성 분석에 필요한 도구가 없어 자동 설치합니다: ${missing
            .map((m) => m.label)
            .join(', ')}`
        })
        const { cancelled } = await installTools(missing, send)
        if (cancelled || sessionCancelled) {
          send({ type: 'done', exitCode: -2 })
          return { ok: true }
        }
        pathEnv = await getFreshPath() // 설치로 바뀐 PATH 반영
      }
    }

    const ok = startScan(cfg, send, pathEnv)
    if (!ok) {
      scanSessionActive = false
      return { ok: false, message: '이미 스캔이 실행 중입니다' }
    }
    return { ok: true }
  })

  ipcMain.handle('scan:cancel', () => {
    sessionCancelled = true
    cancelInstall()
    cancelScan()
    return { ok: true }
  })

  ipcMain.handle('scan:isRunning', () => scanSessionActive || isScanRunning())

  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('app:scannerVersions', async () => {
    const { cmd, args } = backendCommand(['--versions'])
    return new Promise<Record<string, string | null>>((resolve) => {
      execFile(cmd, args, { encoding: 'utf8', windowsHide: true }, (_err, stdout) => {
        const lines = (stdout as string).split(/\r?\n/)
        for (const line of lines) {
          const text = line.trim()
          if (!text) continue
          try {
            const parsed = JSON.parse(text)
            if (parsed?.type === 'versions' && parsed.versions && typeof parsed.versions === 'object') {
              resolve(parsed.versions as Record<string, string | null>)
              return
            }
          } catch {
            // ignore non-JSON lines and continue parsing
          }
        }
        resolve({})
      })
    })
  })

  ipcMain.handle('report:load', (_event, resultFile?: string) => loadReport(resultFile))

  ipcMain.handle('report:recent', () => getRecentScans())

  ipcMain.handle('dialog:selectDir', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:selectArchive', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        // fosslight_util compression_extension 지원 목록
        {
          name: '압축파일',
          extensions: ['zip', 'tar', 'gz', 'tgz', 'xz', 'bz2', 'jar', 'whl', 'rpm']
        },
        { name: '모든 파일', extensions: ['*'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('shell:openExternal', (_event, url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url)
    }
  })

  ipcMain.handle('shell:openPath', (_event, path: string) => shell.openPath(path))

  ipcMain.handle('shell:showInFolder', (_event, path: string) => {
    shell.showItemInFolder(path)
    return basename(join(path))
  })
}
