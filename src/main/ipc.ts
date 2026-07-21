import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { execFile } from 'child_process'
import { rmSync, statSync } from 'fs'
import { basename, join } from 'path'
import {
  startScan,
  cancelScan,
  isScanRunning,
  backendCommand,
  prepareTarget
} from './scanRunner'
import {
  checkMissingTools,
  installTools,
  cancelInstall,
  getFreshPath,
  preferPython312,
  ensureNodeOnPath,
  ensureDependencyPython,
  hasPypiManifest,
  ensureJavaForGradle,
  hasJavaManifest,
  ensureMaven,
  hasMavenManifest
} from './depInstaller'
import { addRecentScan, getRecentScans, loadReport } from './reportStore'
import type { GitRefValidationResult, ScanConfig, ScanEvent } from '../shared/types'

// 도구 설치 단계까지 포함한 스캔 세션 상태 (동시 실행 방지)
let scanSessionActive = false
let sessionCancelled = false
const LOG_BATCH_INTERVAL_MS = 100
const LOG_BATCH_MAX_SIZE = 50

export function registerIpcHandlers(): void {
  ipcMain.handle('scan:start', async (event, cfg: ScanConfig) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { ok: false, message: '창을 찾을 수 없습니다' }
    if (scanSessionActive) return { ok: false, message: '이미 스캔이 실행 중입니다' }
    scanSessionActive = true
    sessionCancelled = false

    let pendingLogs: Array<{ level: string; message: string }> = []
    let logFlushTimer: NodeJS.Timeout | null = null

    const sendToRenderer = (nextEvent: ScanEvent): void => {
      if (!win.isDestroyed()) win.webContents.send('scan:event', nextEvent)
    }

    const clearLogFlushTimer = (): void => {
      if (!logFlushTimer) return
      clearTimeout(logFlushTimer)
      logFlushTimer = null
    }

    const flushPendingLogs = (): void => {
      clearLogFlushTimer()
      if (pendingLogs.length === 0) return
      sendToRenderer({ type: 'log-batch', entries: pendingLogs })
      pendingLogs = []
    }

    const scheduleLogFlush = (): void => {
      if (logFlushTimer) return
      logFlushTimer = setTimeout(() => {
        logFlushTimer = null
        flushPendingLogs()
      }, LOG_BATCH_INTERVAL_MS)
    }

    const send = (e: ScanEvent): void => {
      if (e.type === 'log') {
        pendingLogs.push({ level: e.level, message: e.message })
        if (pendingLogs.length >= LOG_BATCH_MAX_SIZE) {
          flushPendingLogs()
        } else {
          scheduleLogFlush()
        }
        return
      }

      flushPendingLogs()

      if (e.type === 'result' && e.resultFile) {
        addRecentScan({
          date: new Date().toISOString(),
          analyzedPath: cfg.target,
          resultFile: e.resultFile
        })
      }
      if (e.type === 'done') {
        scanSessionActive = false
        if (preparedDir) {
          try {
            rmSync(preparedDir, { recursive: true, force: true, maxRetries: 3 })
          } catch {
            // 임시 폴더 정리 실패는 결과에 영향 없음 (시스템 temp라 나중에 정리됨)
          }
          preparedDir = null
        }
      }
      sendToRenderer(e)
    }

    let pathEnv = await getFreshPath()
    let scanCfg = cfg
    let preparedDir: string | null = null

    // URL/압축파일은 해제 전까지 manifest를 알 수 없다. 의존성 분석 시에는 먼저
    // 내려받아 해제한 뒤(2단계), 그 폴더를 폴더 대상처럼 다뤄 도구를 설치한다.
    if (cfg.targetType !== 'folder' && cfg.modes.includes('dependency')) {
      send({ type: 'phase', phase: 'preparing' })
      const dest = join(app.getPath('temp'), `fl-src-${Date.now()}`)
      const prepared = await prepareTarget(cfg, dest, send, pathEnv)
      if (sessionCancelled) {
        send({ type: 'done', exitCode: -2 })
        return { ok: true }
      }
      if (!prepared.ok) {
        scanSessionActive = false
        send({ type: 'error', message: prepared.message || '다운로드/해제에 실패했습니다.' })
        send({ type: 'done', exitCode: -1 })
        return { ok: true }
      }
      preparedDir = prepared.path
      // 리포트에는 원래 URL/압축파일 경로가 남도록 analyzedPath로 전달
      scanCfg = {
        ...cfg,
        targetType: 'folder',
        target: prepared.path,
        analyzedPath: cfg.target
      }
    }

    // 폴더 대상이면 의존성 분석에 필요한 도구를 확인하고 없으면 자동 설치
    if (scanCfg.targetType === 'folder' && scanCfg.modes.includes('dependency')) {
      const missing = await checkMissingTools(scanCfg.target, pathEnv)
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

    let depPython: string | undefined
    let depJava: string | undefined
    if (cfg.modes.includes('dependency')) {
      // pypi 의존성 분석용 venv가 Python 3.12로 만들어지도록 PATH 앞에 둔다.
      // (최신 Python은 프로젝트가 핀한 패키지의 휠이 없어 소스 빌드로 실패하는 경우가 많음)
      const preferred = await preferPython312(pathEnv)
      if (preferred) {
        pathEnv = preferred
        send({ type: 'log', level: 'INFO', message: '의존성 분석에 Python 3.12를 사용합니다.' })
      } else if (hasPypiManifest(scanCfg.target) && !sessionCancelled) {
        // 시스템에 3.12가 없다(winget이 없거나 정책상 설치 실패). pypi 분석을 위해
        // 앱 전용 Python 3.12(pip 포함)를 내려받아 이번 분석에 사용한다.
        depPython = (await ensureDependencyPython(send)) ?? undefined
        if (sessionCancelled) {
          send({ type: 'done', exitCode: -2 })
          return { ok: true }
        }
        if (depPython) {
          send({ type: 'log', level: 'INFO', message: '앱 전용 Python 3.12로 의존성을 분석합니다.' })
        }
      }
      // Node.js가 설치는 됐지만 PATH에 없는 PC 보강 (winget은 이 경우 재설치를 거부한다)
      const withNode = await ensureNodeOnPath(pathEnv)
      if (withNode) {
        pathEnv = withNode
        send({
          type: 'log',
          level: 'INFO',
          message: 'PATH에 없는 Node.js를 찾아 이번 분석에만 사용합니다.'
        })
      }
      // gradle/maven 프로젝트인데 java가 없으면 앱 전용 Java 11을 확보한다
      // (fosslight는 프로젝트의 gradlew를 실행하므로 Gradle 설치는 불필요, Java만 필요)
      if (hasJavaManifest(scanCfg.target) && !sessionCancelled) {
        depJava = (await ensureJavaForGradle(pathEnv, send)) ?? undefined
        if (sessionCancelled) {
          send({ type: 'done', exitCode: -2 })
          return { ok: true }
        }
        if (depJava) {
          send({ type: 'log', level: 'INFO', message: '앱 전용 Java 11로 gradle/maven 분석을 실행합니다.' })
        }
      }
      // maven 프로젝트(pom.xml)인데 mvnw도 시스템 mvn도 없으면 Apache Maven을 확보한다
      if (hasMavenManifest(scanCfg.target) && !sessionCancelled) {
        const withMaven = await ensureMaven(scanCfg.target, pathEnv, send)
        if (sessionCancelled) {
          send({ type: 'done', exitCode: -2 })
          return { ok: true }
        }
        if (withMaven) {
          pathEnv = withMaven
          send({ type: 'log', level: 'INFO', message: '앱 전용 Apache Maven으로 분석을 실행합니다.' })
        }
      }
    }

    const ok = startScan(scanCfg, send, pathEnv, depPython, depJava)
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

  ipcMain.handle('app:validateGitRef', async (_event, url: string, ref: string) => {
    const { cmd, args } = backendCommand(['--validate-git-ref', '--url', url, '--ref', ref])
    return new Promise<GitRefValidationResult>((resolve) => {
      execFile(cmd, args, { encoding: 'utf8', windowsHide: true }, (_err, stdout) => {
        const fallback: GitRefValidationResult = {
          valid: false,
          isGitUrl: true,
          refType: null,
          resolvedRef: null,
          message: '브랜치/태그 검증에 실패했습니다.',
          suggestions: []
        }
        const lines = (stdout as string).split(/\r?\n/)
        for (const line of lines) {
          const text = line.trim()
          if (!text) continue
          try {
            const parsed = JSON.parse(text)
            if (parsed?.type === 'gitRefValidation') {
              resolve({
                valid: Boolean(parsed.valid),
                isGitUrl: Boolean(parsed.isGitUrl),
                refType: parsed.refType === 'branch' || parsed.refType === 'tag' ? parsed.refType : null,
                resolvedRef: typeof parsed.resolvedRef === 'string' ? parsed.resolvedRef : null,
                message: typeof parsed.message === 'string' ? parsed.message : fallback.message,
                suggestions: Array.isArray(parsed.suggestions)
                  ? parsed.suggestions.filter((s: unknown) => typeof s === 'string')
                  : []
              })
              return
            }
          } catch {
            // ignore non-JSON lines and continue parsing
          }
        }
        resolve(fallback)
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

  ipcMain.handle('shell:openPath', async (_event, path: string) => {
    // 실행 파일 실행 방지: 폴더 열기(탐색기)만 허용
    try {
      if (!statSync(path).isDirectory()) return '폴더만 열 수 있습니다'
    } catch {
      return '경로를 찾을 수 없습니다'
    }
    return shell.openPath(path)
  })

  ipcMain.handle('shell:showInFolder', (_event, path: string) => {
    shell.showItemInFolder(path)
    return basename(join(path))
  })
}
