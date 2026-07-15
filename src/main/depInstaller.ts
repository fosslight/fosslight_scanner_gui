import { execFile, spawn, ChildProcess } from 'child_process'
import { readdirSync } from 'fs'
import { promisify } from 'util'
import type { ScanEvent } from '../shared/types'

const execFileP = promisify(execFile)

// manifest 파일 → 의존성 분석에 필요한 도구와 winget 패키지
// (python-backend/src/backend_main.py의 MANIFEST_TOOLS와 대상 동일)
interface ToolSpec {
  tool: string
  label: string
  wingetId: string | null // null이면 자동 설치 미지원 (수동 안내)
  needsJava?: boolean
}

const JAVA_SPEC: ToolSpec = {
  tool: 'java',
  label: 'JDK (Temurin 21)',
  wingetId: 'EclipseAdoptium.Temurin.21.JDK'
}

const MANIFEST_TOOLS: Record<string, ToolSpec> = {
  'package.json': { tool: 'npm', label: 'Node.js (npm)', wingetId: 'OpenJS.NodeJS.LTS' },
  'pom.xml': { tool: 'mvn', label: 'Apache Maven', wingetId: 'Apache.Maven', needsJava: true },
  'build.gradle': { tool: 'gradle', label: 'Gradle', wingetId: 'Gradle.Gradle', needsJava: true },
  'build.gradle.kts': {
    tool: 'gradle',
    label: 'Gradle',
    wingetId: 'Gradle.Gradle',
    needsJava: true
  },
  'requirements.txt': { tool: 'python', label: 'Python', wingetId: 'Python.Python.3.12' },
  'setup.py': { tool: 'python', label: 'Python', wingetId: 'Python.Python.3.12' },
  Pipfile: { tool: 'python', label: 'Python', wingetId: 'Python.Python.3.12' },
  'go.mod': { tool: 'go', label: 'Go', wingetId: 'GoLang.Go' },
  'Cargo.toml': { tool: 'cargo', label: 'Rust (cargo)', wingetId: 'Rustlang.Rustup' },
  Gemfile: { tool: 'gem', label: 'Ruby (gem)', wingetId: 'RubyInstallerTeam.RubyWithDevKit.3.3' },
  'pubspec.yaml': { tool: 'flutter', label: 'Flutter', wingetId: null }
}

let installChild: ChildProcess | null = null
let installCancelled = false

/** Microsoft Store의 앱 실행 별칭(WindowsApps)을 PATH 맨 뒤로 밀어, 실제 설치된
 * 도구가 stub보다 우선 해석되게 한다. Python을 설치하지 않은 Windows에는
 * `WindowsApps\python.exe`(스토어로 리디렉트하는 가짜)가 PATH에 있어, 그대로 두면
 * fosslight의 `python -m venv`가 이 stub으로 실행되어 실패한다. (winget 등 다른
 * 별칭은 뒤로 밀리기만 하므로 계속 사용 가능) */
function demoteWindowsAppsPath(pathEnv: string): string {
  const segments = pathEnv.split(';')
  const isWindowsApps = (p: string): boolean => /\\Microsoft\\WindowsApps\\?$/i.test(p.trim())
  const real = segments.filter((p) => !isWindowsApps(p))
  const apps = segments.filter((p) => isWindowsApps(p))
  return [...real, ...apps].join(';')
}

/** 설치 직후 반영을 위해 레지스트리에서 최신 PATH를 읽는다 (프로세스 env는 갱신 안 됨) */
export async function getFreshPath(): Promise<string> {
  try {
    const { stdout } = await execFileP('powershell.exe', [
      '-NoProfile',
      '-Command',
      "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"
    ])
    const fresh = stdout.trim()
    return demoteWindowsAppsPath(fresh || process.env.PATH || '')
  } catch {
    return demoteWindowsAppsPath(process.env.PATH || '')
  }
}

async function toolExists(tool: string, pathEnv: string): Promise<boolean> {
  try {
    await execFileP('where.exe', [tool], { env: { ...process.env, PATH: pathEnv } })
    return true
  } catch {
    return false
  }
}

/** `python`이 실제로 동작하는 인터프리터인지 확인한다. Microsoft Store stub은
 * `where.exe python`에는 잡히지만 실행하면 실패하므로, where만으로는 설치 여부를
 * 오판한다(→ 진짜 Python 설치를 건너뜀). 실제 실행으로 검증한다. */
async function pythonUsable(pathEnv: string): Promise<boolean> {
  try {
    const { stdout } = await execFileP('python', ['-c', 'import sys; sys.stdout.write("ok")'], {
      env: { ...process.env, PATH: pathEnv }
    })
    return stdout.includes('ok')
  } catch {
    return false
  }
}

async function wingetAvailable(pathEnv: string): Promise<boolean> {
  return toolExists('winget', pathEnv)
}

/** 대상 폴더의 manifest를 보고 미설치 도구 목록을 반환 */
export async function checkMissingTools(targetPath: string, pathEnv: string): Promise<ToolSpec[]> {
  let entries: Set<string>
  try {
    entries = new Set(readdirSync(targetPath))
  } catch {
    return []
  }

  const needed = new Map<string, ToolSpec>()
  for (const [manifest, spec] of Object.entries(MANIFEST_TOOLS)) {
    if (entries.has(manifest)) {
      needed.set(spec.tool, spec)
      if (spec.needsJava) needed.set(JAVA_SPEC.tool, JAVA_SPEC)
    }
  }

  const missing: ToolSpec[] = []
  for (const spec of needed.values()) {
    const present =
      spec.tool === 'python'
        ? await pythonUsable(pathEnv)
        : await toolExists(spec.tool, pathEnv)
    if (!present) missing.push(spec)
  }
  return missing
}

/** winget으로 도구 설치. 진행 상황을 onEvent로 스트리밍하고 성공 개수를 반환 */
export async function installTools(
  missing: ToolSpec[],
  onEvent: (e: ScanEvent) => void
): Promise<{ installed: number; cancelled: boolean }> {
  installCancelled = false
  const pathEnv = await getFreshPath()

  if (!(await wingetAvailable(pathEnv))) {
    onEvent({
      type: 'log',
      level: 'WARNING',
      message:
        'winget(앱 설치 관리자)을 사용할 수 없어 자동 설치를 건너뜁니다. ' +
        `다음 도구를 직접 설치해주세요: ${missing.map((m) => m.label).join(', ')}`
    })
    return { installed: 0, cancelled: false }
  }

  let installed = 0
  for (const spec of missing) {
    if (installCancelled) return { installed, cancelled: true }

    if (!spec.wingetId) {
      onEvent({
        type: 'log',
        level: 'WARNING',
        message: `${spec.label}은(는) 자동 설치를 지원하지 않습니다. 직접 설치 후 다시 스캔해주세요.`
      })
      continue
    }

    onEvent({
      type: 'log',
      level: 'INFO',
      message: `${spec.label} 자동 설치를 시작합니다 (winget: ${spec.wingetId}) — 몇 분 걸릴 수 있습니다...`
    })

    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn(
        'winget',
        [
          'install',
          '--id',
          spec.wingetId!,
          '-e',
          '--silent',
          '--accept-package-agreements',
          '--accept-source-agreements',
          '--disable-interactivity'
        ],
        { windowsHide: true, env: { ...process.env, PATH: pathEnv } }
      )
      installChild = child
      child.stdout.on('data', (d: Buffer) => {
        const line = d.toString().trim()
        // winget 진행 바(스피너) 잡음은 제외하고 의미 있는 줄만 전달
        if (line && !/^[-\\|/\s%.\d█▒KMGB]*$/.test(line)) {
          onEvent({ type: 'log', level: 'INFO', message: `[winget] ${line.slice(0, 200)}` })
        }
      })
      child.on('error', () => resolve(-1))
      child.on('close', (code) => resolve(code ?? -1))
    })
    installChild = null

    if (installCancelled) return { installed, cancelled: true }

    // winget 성공(0) 또는 이미 설치됨(-1978335189 = 0x8A15002B)
    if (exitCode === 0 || exitCode === -1978335189) {
      installed += 1
      onEvent({ type: 'log', level: 'INFO', message: `${spec.label} 설치 완료` })
    } else {
      onEvent({
        type: 'log',
        level: 'WARNING',
        message:
          `${spec.label} 자동 설치에 실패했습니다 (winget 코드 ${exitCode}). ` +
          '직접 설치가 필요할 수 있으며, 해당 의존성 분석은 실패할 수 있습니다.'
      })
    }
  }
  return { installed, cancelled: installCancelled }
}

export function cancelInstall(): void {
  installCancelled = true
  if (installChild?.pid) {
    execFile('taskkill', ['/PID', String(installChild.pid), '/T', '/F'])
  }
}

export function isInstalling(): boolean {
  return installChild !== null
}
