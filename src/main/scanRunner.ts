import { spawn, execFile, ChildProcess } from 'child_process'
import { createInterface } from 'readline'
import { app } from 'electron'
import { join } from 'path'
import { appendFileSync, mkdirSync } from 'fs'
import type { ScanConfig, ScanEvent } from '../shared/types'

let currentChild: ChildProcess | null = null

function backendCommand(args: string[]): { cmd: string; args: string[] } {
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

function scanLogPath(): string {
  const dir = join(app.getPath('userData'), 'logs')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'scan.log')
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
  const { cmd, args } = backendCommand([
    targetArg,
    cfg.target,
    '--modes',
    modes,
    '--exclude',
    cfg.excludePaths.join(';'),
    '--output',
    cfg.outputDir
  ])

  const env = pathEnv ? { ...process.env, PATH: pathEnv, Path: pathEnv } : process.env
  const child = spawn(cmd, args, { windowsHide: true, env })
  currentChild = child

  createInterface({ input: child.stdout }).on('line', (line) => {
    try {
      onEvent(JSON.parse(line) as ScanEvent)
    } catch {
      // NDJSON이 아닌 잡음(써드파티 print 등)은 무시
    }
  })

  child.stderr.on('data', (d: Buffer) => {
    try {
      appendFileSync(scanLogPath(), d.toString())
    } catch {
      // 로그 기록 실패는 스캔에 영향 없음
    }
  })

  child.on('error', (err) => {
    currentChild = null
    onEvent({ type: 'error', message: `백엔드 실행 실패: ${err.message}` })
    onEvent({ type: 'done', exitCode: -1 })
  })

  child.on('close', (code) => {
    currentChild = null
    onEvent({ type: 'done', exitCode: code ?? -1 })
  })

  return true
}

export function cancelScan(): void {
  if (!currentChild?.pid) return
  // scancode가 multiprocessing 자식을 만들므로 프로세스 트리 전체 종료
  execFile('taskkill', ['/PID', String(currentChild.pid), '/T', '/F'])
}
