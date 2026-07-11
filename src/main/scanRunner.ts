import { spawn, execFile, ChildProcess } from 'child_process'
import { createInterface } from 'readline'
import { app } from 'electron'
import { join } from 'path'
import { createWriteStream, mkdirSync, WriteStream } from 'fs'
import type { ScanConfig, ScanEvent } from '../shared/types'

let currentChild: ChildProcess | null = null

export function getGuiResultPath(): string {
  // 설치 폴더는 per-machine 설치 시 쓰기 불가일 수 있어 userData에 저장한다.
  return join(app.getPath('userData'), 'gui_result.json')
}

export function backendCommand(args: string[]): { cmd: string; args: string[] } {
  if (app.isPackaged) {
    return {
      cmd: join(process.resourcesPath, 'backend', 'fosslight-backend.exe'),
      args
    }
  }
  // 개발 모드: venv Python으로 래퍼 직접 실행
  const backendDir = join(app.getAppPath(), 'python-backend')
  return {
    cmd: join(backendDir, '.venv', 'Scripts', 'python.exe'),
    args: [join(backendDir, 'src', 'backend_main.py'), ...args]
  }
}

function scanLogPath(outputDir: string): string {
  // 스캔 결과와 함께 배포/공유할 수 있도록 출력 폴더에 스캔별 로그를 남긴다
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  const ts =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  mkdirSync(outputDir, { recursive: true })
  return join(outputDir, `fosslight_gui_${ts}.log`)
}

function logTimestamp(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

export function isScanRunning(): boolean {
  return currentChild !== null
}

export function startScan(
  cfg: ScanConfig,
  onEvent: (e: ScanEvent) => void,
  pathEnv?: string // 도구 자동 설치 직후 갱신된 PATH 반영용
): boolean {
  if (currentChild) return false

  const modes = cfg.modes.length === 3 ? 'all' : cfg.modes.join(',')
  const targetArg = cfg.targetType === 'url' ? '--url' : '--path'
  let target = cfg.target
  if (cfg.targetType === 'url' && cfg.gitRef?.trim()) {
    const refType = cfg.gitRefType === 'tag' ? 'tag' : 'branch'
    target = `${target};${refType}=${cfg.gitRef.trim()}`
  }
  const { cmd, args } = backendCommand([
    targetArg,
    target,
    '--modes',
    modes,
    '--exclude',
    cfg.excludePaths.join(';'),
    '--output',
    cfg.outputDir,
    '--result-file',
    getGuiResultPath()
  ])

  const env = pathEnv ? { ...process.env, PATH: pathEnv, Path: pathEnv } : process.env
  const child = spawn(cmd, args, { windowsHide: true, env })
  currentChild = child
  let scanLogStream: WriteStream | null = null

  try {
    scanLogStream = createWriteStream(scanLogPath(cfg.outputDir), { flags: 'a' })
    scanLogStream.write(
      `FOSSLight Scanner GUI v${app.getVersion()} 스캔 로그\n` +
        `대상: ${cfg.target}\n모드: ${cfg.modes.join(', ')}\n출력: ${cfg.outputDir}\n---\n`
    )
  } catch {
    scanLogStream = null
  }

  const writeLog = (text: string): void => {
    // 동기 파일 쓰기는 메인 프로세스를 잠그므로 스트림으로 비동기 기록한다.
    try {
      scanLogStream?.write(text)
    } catch {
      // 로그 기록 실패는 스캔에 영향 없음
    }
  }

  const logEvent = (e: ScanEvent): void => {
    if (e.type === 'log') {
      writeLog(`${logTimestamp()} [${e.level}] ${e.message}\n`)
    } else if (e.type === 'phase') {
      writeLog(`${logTimestamp()} == ${e.phase} ==\n`)
    } else if (e.type === 'error') {
      writeLog(`${logTimestamp()} [ERROR] ${e.message}\n${e.traceback ?? ''}\n`)
    } else if (e.type === 'result') {
      writeLog(`${logTimestamp()} [RESULT] ${e.resultFile ?? '(없음)'}\n`)
    }
  }

  createInterface({ input: child.stdout }).on('line', (line) => {
    try {
      const e = JSON.parse(line) as ScanEvent
      logEvent(e)
      onEvent(e)
    } catch {
      // NDJSON이 아닌 잡음(써드파티 print 등)은 무시
    }
  })

  child.stderr.on('data', (d: Buffer) => {
    writeLog(d.toString())
  })

  const closeLogStream = (exitCode: number): void => {
    try {
      scanLogStream?.write(`${logTimestamp()} == 종료 (exit=${exitCode}) ==\n`)
      scanLogStream?.end()
    } catch {
      // no-op
    }
    scanLogStream = null
  }

  child.on('error', (err) => {
    currentChild = null
    writeLog(`${logTimestamp()} [ERROR] 백엔드 실행 실패: ${err.message}\n`)
    closeLogStream(-1)
    onEvent({ type: 'error', message: `백엔드 실행 실패: ${err.message}` })
    onEvent({ type: 'done', exitCode: -1 })
  })

  child.on('close', (code) => {
    currentChild = null
    closeLogStream(code ?? -1)
    onEvent({ type: 'done', exitCode: code ?? -1 })
  })

  return true
}

export function cancelScan(): void {
  if (!currentChild?.pid) return
  // scancode가 multiprocessing 자식을 만들므로 프로세스 트리 전체 종료
  execFile('taskkill', ['/PID', String(currentChild.pid), '/T', '/F'])
}
