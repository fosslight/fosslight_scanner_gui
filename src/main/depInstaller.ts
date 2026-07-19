import { execFile, spawn, ChildProcess } from 'child_process'
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { promisify } from 'util'
import { app, net } from 'electron'
import type { ScanEvent } from '../shared/types'

const execFileP = promisify(execFile)

// python/pip이 없는 환경을 위한 재배포 가능 Python 3.12 (pip·venv 포함, 시스템 설치 불필요).
// python-build-standalone(install_only) — userData에 1회 다운로드/해제하여 사용한다.
const STANDALONE_PY_URL =
  'https://github.com/astral-sh/python-build-standalone/releases/download/20260718/' +
  'cpython-3.12.13%2B20260718-x86_64-pc-windows-msvc-install_only.tar.gz'
// pypi 의존성 분석에만 python이 필요하므로, 다운로드는 이 manifest가 있을 때만 한다.
const PYPI_MANIFESTS = ['requirements.txt', 'setup.py', 'setup.cfg', 'pyproject.toml', 'Pipfile']
let downloadAbort: AbortController | null = null

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

// winget 종료 코드 (부호 없는 32비트). UPDATE_NOT_APPLICABLE은 "이미 설치되어 있어
// 적용할 업데이트가 없음" — 설치는 안 됐지만 도구는 이미 있다는 뜻이므로 실패가 아니다.
const WINGET_NO_UPGRADE = 0x8a15002b
const WINGET_ALREADY_INSTALLED = 0x8a150061

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

/** 의존성 분석용 Python 3.12의 설치 폴더를 찾는다 (없으면 null).
 * fosslight의 pypi 분석은 `python -m venv`로 PATH의 첫 Python을 쓰는데, 최신
 * Python(3.13/3.14)은 프로젝트가 핀한 패키지의 미리 빌드된 휠이 없는 경우가 많아
 * pip이 소스 빌드로 넘어가고(→ MSVC 컴파일러 필요) clean PC에서 실패한다.
 * (예: lxml==5.3.0은 cp313까지만 휠 제공, cp314 없음)
 * 휠 커버리지가 넓은 3.12를 쓰기 위해 그 위치를 찾는다.
 * Microsoft Store stub은 3.12로 잡히지 않으므로 자연히 걸러진다. */
async function findPython312(): Promise<string | null> {
  // py 런처가 가장 확실 (Python 설치 시 기본 포함)
  try {
    const { stdout } = await execFileP('py', [
      '-3.12',
      '-c',
      'import sys; sys.stdout.write(sys.executable)'
    ])
    const exe = stdout.trim()
    if (exe && existsSync(exe)) return dirname(exe)
  } catch {
    // py 런처가 없거나 3.12 미설치 — 아래 기본 경로로 확인
  }
  const candidates = [
    join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Python', 'Python312', 'python.exe'),
    join(process.env.PROGRAMFILES ?? '', 'Python312', 'python.exe'),
    'C:\\Python312\\python.exe'
  ]
  for (const exe of candidates) {
    if (exe && existsSync(exe)) return dirname(exe)
  }
  return null
}

/** 주어진 폴더들을 PATH 맨 앞에 둔다 (중복 항목은 제거) */
function prependToPath(pathEnv: string, dirs: string[]): string {
  const isSame = (p: string, target: string): boolean =>
    p.trim().replace(/\\+$/, '').toLowerCase() === target.toLowerCase()
  const rest = pathEnv.split(';').filter((p) => !dirs.some((d) => isSame(p, d)))
  return [...dirs, ...rest].join(';')
}

/** 의존성 분석 시 venv가 Python 3.12로 만들어지도록 PATH 맨 앞에 둔다.
 * 3.12가 없으면 PATH를 그대로 둔다(기존 동작 유지). */
export async function preferPython312(pathEnv: string): Promise<string | null> {
  const dir = await findPython312()
  if (!dir) return null
  return prependToPath(pathEnv, [dir, join(dir, 'Scripts')])
}

/** 대상 폴더에 pypi manifest가 있는지 (있을 때만 Python이 필요) */
export function hasPypiManifest(targetPath: string): boolean {
  try {
    const entries = new Set(readdirSync(targetPath))
    return PYPI_MANIFESTS.some((m) => entries.has(m))
  } catch {
    return false
  }
}

function depPythonDir(): string {
  return join(app.getPath('userData'), 'pydep-python')
}
function depPythonExe(): string {
  // python-build-standalone(install_only)은 python/ 하위에 python.exe를 둔다
  return join(depPythonDir(), 'python', 'python.exe')
}

/** 주어진 python.exe가 3.12이고 venv/pip을 갖췄는지 확인 */
async function verifyPython(exe: string): Promise<boolean> {
  try {
    const { stdout } = await execFileP(exe, [
      '-c',
      'import sys, venv, ensurepip; sys.stdout.write(sys.version)'
    ])
    return /^3\.12\./.test(stdout.trim())
  } catch {
    return false
  }
}

/** URL을 파일로 내려받는다. Electron net을 쓰므로 리다이렉트를 따르고 Windows
 * 시스템 프록시를 자동 사용한다(회사 PC 프록시 환경 대응). Node fetch는 시스템
 * 프록시를 쓰지 않아 사내망에서 실패할 수 있다. */
function downloadToFile(url: string, dest: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    const onAbort = (): void => request.abort()
    signal.addEventListener('abort', onAbort)
    request.on('response', (response) => {
      const status = response.statusCode ?? 0
      if (status >= 400) {
        reject(new Error(`HTTP ${status}`))
        return
      }
      const file = createWriteStream(dest)
      response.on('data', (chunk) => file.write(chunk))
      response.on('end', () => file.end())
      response.on('error', reject)
      file.on('error', reject)
      file.on('close', () => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      })
    })
    request.on('error', reject)
    request.on('abort', () => reject(new Error('취소됨')))
    request.end()
  })
}

/** python/pip이 없는 환경을 위해, 재배포 가능한 Python 3.12(pip·venv 포함)를 userData로
 * 1회 다운로드/해제하여 그 python.exe 경로를 돌려준다. 이미 있으면 재사용. 실패 시 null.
 * winget에 의존하지 않으므로 winget이 없거나 정책상 설치가 막힌 PC에서도 동작한다. */
export async function downloadStandalonePython(
  onEvent: (e: ScanEvent) => void
): Promise<string | null> {
  const exe = depPythonExe()
  if (existsSync(exe) && (await verifyPython(exe))) return exe // 캐시 재사용

  const dir = depPythonDir()
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // 이전 잔여물 정리 실패는 무시
  }
  mkdirSync(dir, { recursive: true })
  const tgz = join(dir, 'python312.tar.gz')

  onEvent({
    type: 'log',
    level: 'INFO',
    message: 'Python 3.12가 없어 앱 전용 Python 3.12(pip 포함)를 내려받습니다 (최초 1회, 약 45MB)...'
  })
  try {
    downloadAbort = new AbortController()
    await downloadToFile(STANDALONE_PY_URL, tgz, downloadAbort.signal)
  } catch (e) {
    onEvent({
      type: 'log',
      level: 'WARNING',
      message: `Python 3.12 다운로드에 실패했습니다: ${(e as Error).message}`
    })
    return null
  } finally {
    downloadAbort = null
  }

  onEvent({ type: 'log', level: 'INFO', message: 'Python 3.12 압축을 해제하는 중...' })
  try {
    // Windows 10 1803+ 기본 tar.exe(bsdtar)가 .tar.gz를 자동 처리한다.
    // 반드시 System32의 bsdtar를 절대경로로 호출한다 — PATH에 Git/MSYS의 GNU tar가
    // 있으면 'C:\...' 경로를 원격 호스트로 오해해 실패한다.
    const tarExe = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
    await execFileP(tarExe, ['-xf', tgz, '-C', dir], { windowsHide: true })
  } catch (e) {
    onEvent({
      type: 'log',
      level: 'WARNING',
      message: `Python 3.12 압축 해제에 실패했습니다: ${(e as Error).message}`
    })
    return null
  }
  try {
    rmSync(tgz, { force: true })
  } catch {
    // 임시 파일 정리 실패는 무시
  }

  if (existsSync(exe) && (await verifyPython(exe))) {
    onEvent({ type: 'log', level: 'INFO', message: '앱 전용 Python 3.12 준비 완료' })
    return exe
  }
  onEvent({ type: 'log', level: 'WARNING', message: '앱 전용 Python 3.12 준비에 실패했습니다.' })
  return null
}

/** 의존성(pypi) 분석에 쓸 Python 3.12 절대경로를 확보한다.
 * 시스템에 3.12가 있으면 그 경로를, 없으면 내려받아 반환. (없으면 null) */
export async function ensureDependencyPython(
  onEvent: (e: ScanEvent) => void
): Promise<string | null> {
  const dir = await findPython312()
  if (dir) return join(dir, 'python.exe')
  return downloadStandalonePython(onEvent)
}

/** PATH에 없더라도 설치된 Node.js 폴더를 찾는다.
 * Node.js 설치 시 PATH 등록을 하지 않은 PC가 있는데, 이 경우 winget은 ARP 기록을 보고
 * "이미 설치됨/최신"(UPDATE_NOT_APPLICABLE)이라며 재설치를 거부해 계속 npm을 못 찾게 된다. */
function findNodeDir(): string | null {
  const candidates = [
    join(process.env.PROGRAMFILES ?? '', 'nodejs', 'node.exe'),
    join(process.env['PROGRAMFILES(X86)'] ?? '', 'nodejs', 'node.exe'),
    join(process.env.LOCALAPPDATA ?? '', 'Programs', 'nodejs', 'node.exe')
  ]
  for (const exe of candidates) {
    if (exe && existsSync(exe)) return dirname(exe)
  }
  return null
}

/** node가 PATH에서 안 잡히는데 설치는 되어 있으면 그 폴더를 PATH에 보강한다.
 * 보강했으면 새 PATH를, 필요 없거나 찾지 못하면 null을 돌려준다. */
export async function ensureNodeOnPath(pathEnv: string): Promise<string | null> {
  if (await toolExists('node', pathEnv)) return null // 이미 잡힘
  const dir = findNodeDir()
  if (!dir) return null // 실제로 미설치 — 자동 설치/안내에 맡긴다
  return prependToPath(pathEnv, [dir])
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
    // pypi 분석용 venv는 3.12로 만들어야 하므로(휠 커버리지), 다른 버전만 있어도 설치 대상
    const present =
      spec.tool === 'python'
        ? (await findPython312()) !== null
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

    // winget 종료 코드는 부호 없는 32비트로 전달되므로 그렇게 비교해야 한다
    // (기존의 부호 있는 값 비교는 절대 일치하지 않아 정상 결과도 실패로 처리됐음)
    const code = exitCode >>> 0
    if (exitCode === 0 || code === WINGET_NO_UPGRADE || code === WINGET_ALREADY_INSTALLED) {
      installed += 1
      onEvent({
        type: 'log',
        level: 'INFO',
        message: exitCode === 0 ? `${spec.label} 설치 완료` : `${spec.label}은(는) 이미 설치되어 있습니다.`
      })
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
  downloadAbort?.abort() // 진행 중인 Python 다운로드도 중단
  if (installChild?.pid) {
    execFile('taskkill', ['/PID', String(installChild.pid), '/T', '/F'])
  }
}

export function isInstalling(): boolean {
  return installChild !== null
}
