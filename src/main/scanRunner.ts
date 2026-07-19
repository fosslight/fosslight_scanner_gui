import { spawn, execFile, ChildProcess } from 'child_process'
import { createInterface } from 'readline'
import { app } from 'electron'
import { dirname, join } from 'path'
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

/** URL/압축파일을 미리 내려받아 해제만 하고 그 폴더 경로를 돌려준다.
 * fosslight는 다운로드 직후 바로 분석에 들어가 중간에 도구를 설치할 수 없으므로,
 * 이 단계로 소스를 먼저 확보해 manifest를 보고 필요한 도구를 설치한 뒤 본 스캔을 돌린다. */
export function prepareTarget(
  cfg: ScanConfig,
  dest: string,
  onEvent: (e: ScanEvent) => void,
  pathEnv?: string
): Promise<{ ok: boolean; path: string; message: string }> {
  const args = ['--prepare', '--dest', dest]
  if (cfg.targetType === 'url') {
    let target = cfg.target
    if (cfg.gitRef?.trim()) {
      const refType = cfg.gitRefType === 'tag' ? 'tag' : 'branch'
      target = `${target};${refType}=${cfg.gitRef.trim()}`
    }
    args.push('--url', target)
  } else {
    args.push('--path', cfg.target)
  }

  const { cmd, args: spawnArgs } = backendCommand(args)
  const env = pathEnv ? { ...process.env, PATH: pathEnv, Path: pathEnv } : process.env

  return new Promise((resolve) => {
    const child = spawn(cmd, spawnArgs, { windowsHide: true, env })
    currentChild = child // 준비 단계도 취소 버튼으로 중단할 수 있게
    let result: { ok: boolean; path: string; message: string } | null = null

    createInterface({ input: child.stdout }).on('line', (line) => {
      try {
        const e = JSON.parse(line) as ScanEvent | { type: 'prepared'; success: boolean; path: string; message: string }
        if (e.type === 'prepared') {
          result = { ok: e.success, path: e.path, message: e.message }
          return
        }
        onEvent(e as ScanEvent)
      } catch {
        // NDJSON이 아닌 잡음은 무시
      }
    })

    child.on('error', (err) => {
      currentChild = null
      resolve({ ok: false, path: dest, message: `준비 단계 실행 실패: ${err.message}` })
    })
    child.on('close', () => {
      currentChild = null
      resolve(result ?? { ok: false, path: dest, message: '다운로드/해제에 실패했습니다.' })
    })
  })
}

export function isScanRunning(): boolean {
  return currentChild !== null
}

export function startScan(
  cfg: ScanConfig,
  onEvent: (e: ScanEvent) => void,
  pathEnv?: string, // 도구 자동 설치 직후 갱신된 PATH 반영용
  depPython?: string // pypi venv 생성에 쓸 Python 3.12 절대경로 (앱 전용 다운로드본 등)
): boolean {
  if (currentChild) return false

  const modes = cfg.modes.length === 3 ? 'all' : cfg.modes.join(',')
  const targetArg = cfg.targetType === 'url' ? '--url' : '--path'
  let target = cfg.target
  if (cfg.targetType === 'url' && cfg.gitRef?.trim()) {
    const refType = cfg.gitRefType === 'tag' ? 'tag' : 'branch'
    target = `${target};${refType}=${cfg.gitRef.trim()}`
  }
  const backendArgs = [
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
  ]
  if (cfg.kbUrl?.trim()) backendArgs.push('--kb-url', cfg.kbUrl.trim())
  if (cfg.kbToken?.trim()) backendArgs.push('--kb-token', cfg.kbToken.trim())
  if (cfg.analyzedPath?.trim()) backendArgs.push('--analyzed-path', cfg.analyzedPath.trim())
  const { cmd, args } = backendCommand(backendArgs)

  const env: NodeJS.ProcessEnv = pathEnv
    ? { ...process.env, PATH: pathEnv, Path: pathEnv }
    : { ...process.env }
  if (depPython) {
    // 백엔드가 venv 생성 시 이 인터프리터를 최우선 사용하도록 전달하고,
    // python/pip도 이 폴더로 잡히도록 PATH 앞에 둔다.
    env.FL_DEP_PYTHON = depPython
    const pyDir = dirname(depPython)
    const withPy = [pyDir, join(pyDir, 'Scripts'), env.PATH ?? ''].filter(Boolean).join(';')
    env.PATH = withPy
    env.Path = withPy
  }
  const child = spawn(cmd, args, { windowsHide: true, env })
  currentChild = child
  let scanLogStream: WriteStream | null = null

  // 로그 파일은 스캔 진행 화면의 "터미널창"(로그 콘솔)과 동일한 내용을 담는다.
  // 콘솔에는 안 보이는 원시 stderr는 본문에 섞지 않고, 비정상 종료 시에만
  // 진단용으로 말미에 첨부한다(크래시 원인 유실 방지).
  const stderrChunks: string[] = []
  let stderrBytes = 0
  const STDERR_TAIL_LIMIT = 64 * 1024

  try {
    scanLogStream = createWriteStream(scanLogPath(cfg.outputDir), { flags: 'a' })
    scanLogStream.write(
      `FOSSLight Scanner GUI v${app.getVersion()} 스캔 로그\n` +
        `일시: ${logTimestamp()}\n대상: ${cfg.target}\n모드: ${cfg.modes.join(', ')}\n` +
        `출력: ${cfg.outputDir}\n---\n`
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
    // 앱 로그 콘솔(appStore)과 동일한 형식/내용으로 기록한다.
    if (e.type === 'log') {
      writeLog(`[${e.level}] ${e.message}\n`)
    } else if (e.type === 'log-batch') {
      writeLog(e.entries.map((entry) => `[${entry.level}] ${entry.message}\n`).join(''))
    } else if (e.type === 'error') {
      // 오류는 드물고 진단에 필요하므로 traceback도 함께 남긴다.
      writeLog(`[ERROR] ${e.message}\n`)
      if (e.traceback) writeLog(`${e.traceback}\n`)
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
    // 콘솔에 표시되지 않는 stderr는 버퍼에만 담아두고, 비정상 종료 시에만 기록한다.
    if (stderrBytes < STDERR_TAIL_LIMIT) {
      const text = d.toString()
      stderrChunks.push(text)
      stderrBytes += Buffer.byteLength(text)
    }
  })

  const closeLogStream = (exitCode: number): void => {
    try {
      // 정상 종료(0)가 아니면, 콘솔에 안 나온 stderr를 진단용으로 첨부한다.
      if (exitCode !== 0 && stderrChunks.length > 0) {
        scanLogStream?.write(
          `\n--- 추가 진단 정보 (stderr, 화면 미표시) ---\n${stderrChunks.join('')}\n`
        )
      }
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
