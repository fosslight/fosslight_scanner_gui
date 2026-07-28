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
  manualHint?: string // 자동 설치 불가 시 보여줄 구체적 안내
}

// gradle: fosslight_dependency는 시스템 gradle을 쓰지 않고 프로젝트의 gradlew만
// 실행하므로 Gradle 설치는 무의미하다. 실제로 필요한 것은 Java뿐이며(gradlew가
// gradle 배포판을 자동 다운로드), Java는 winget이 아닌 ensureJavaForGradle()이
// 담당한다(구버전 wrapper 호환을 위해 Java 11 — JDK 21은 gradle 6.x와 비호환).
const JAVA_SPEC: ToolSpec = {
  tool: 'java',
  label: 'Java (Temurin 11)',
  wingetId: null // winget 미사용 — ensureJavaForGradle이 확보
}

const MANIFEST_TOOLS: Record<string, ToolSpec> = {
  'package.json': { tool: 'npm', label: 'Node.js (npm)', wingetId: 'OpenJS.NodeJS.LTS' },
  // maven: winget에 Apache Maven 공식 패키지가 없다. mvnw가 없으면 시스템 mvn이
  // 필요하며, ensureMaven()이 없을 때 Apache Maven을 직접 내려받아 제공한다. Java도 필요.
  'pom.xml': { tool: 'mvn', label: 'Apache Maven', wingetId: null, needsJava: true },
  'build.gradle': { ...JAVA_SPEC },
  'build.gradle.kts': { ...JAVA_SPEC },
  'requirements.txt': { tool: 'python', label: 'Python', wingetId: 'Python.Python.3.12' },
  'setup.py': { tool: 'python', label: 'Python', wingetId: 'Python.Python.3.12' },
  Pipfile: { tool: 'python', label: 'Python', wingetId: 'Python.Python.3.12' },
  'go.mod': { tool: 'go', label: 'Go', wingetId: 'GoLang.Go' },
  // helm: 분석 시 `helm dependency build`를 실행하므로 Helm CLI가 필요하다
  'Chart.yaml': { tool: 'helm', label: 'Helm', wingetId: 'Helm.Helm' },
  'Cargo.toml': { tool: 'cargo', label: 'Rust (cargo)', wingetId: 'Rustlang.Rustup' },
  Gemfile: { tool: 'gem', label: 'Ruby (gem)', wingetId: 'RubyInstallerTeam.RubyWithDevKit.3.3' },
  // flutter: pub 분석은 `flutter pub get/deps` 실행이 필요한데, Flutter SDK는 1GB+
  // (첫 실행 시 Dart SDK·엔진을 추가로 더 받음)라 런타임 자동 확보가 비현실적이다.
  'pubspec.yaml': {
    tool: 'flutter',
    label: 'Flutter',
    wingetId: null,
    manualHint:
      'Flutter SDK는 1GB 이상으로 자동 설치하지 않습니다. ' +
      'https://docs.flutter.dev/get-started/install/windows 에서 설치하고 ' +
      'flutter\\bin을 PATH에 추가한 뒤(터미널에서 `flutter --version` 확인) 다시 스캔해주세요.'
  }
}

// java가 필요한 manifest (gradle wrapper 실행 / maven)
const JAVA_MANIFESTS = ['build.gradle', 'build.gradle.kts', 'pom.xml']
// Temurin 11 JRE (gradle wrapper 5.x~8.x 호환 폭이 가장 넓음, 약 41MB)
const TEMURIN11_URL =
  'https://api.adoptium.net/v3/binary/latest/11/ga/windows/x64/jre/hotspot/normal/eclipse'
// 버전 카탈로그를 쓰는 최신 프로젝트용 Temurin 17 JDK(약 182MB).
// 두 가지가 동시에 필요해서 JRE 11로는 안 된다:
//  1) Gradle이 카탈로그 접근자 클래스를 컴파일 → javac 필요("No Java compiler found")
//  2) 최신 Android Gradle Plugin 8.x는 Java 17을 요구("requires Java 17 to run")
// 기본을 17로 올리면 구버전 gradle wrapper가 깨지므로, 카탈로그가 감지될 때만 받는다.
const TEMURIN17_JDK_URL =
  'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse'
// Apache Maven (winget에 없음). mvnw가 없는 pom.xml 프로젝트에 제공, 약 8MB.
const MAVEN_VERSION = '3.9.9'
const MAVEN_URL =
  `https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/` +
  `apache-maven-${MAVEN_VERSION}-bin.zip`

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
export function prependToPath(pathEnv: string, dirs: string[]): string {
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

// manifest 재귀 탐색 시 건너뛸 폴더 (대용량/무관). node_modules는 하위에 package.json이
// 수천 개라 반드시 제외.
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', '.venv', 'venv', 'env', '__pycache__',
  'dist', 'build', 'out', '.gradle', '.idea', '.vscode', '.tox', 'target'
])
const MANIFEST_NAMES = new Set<string>([...Object.keys(MANIFEST_TOOLS), ...PYPI_MANIFESTS])

/** 대상 폴더 트리에서 manifest 파일명들을 재귀로 수집한다(깊이 제한, 대용량 폴더 제외).
 * URL/압축 스캔은 프로젝트가 하위 폴더(예: repo-branch/)로 풀리므로, fosslight의
 * 재귀 감지와 맞추려면 최상위만 봐선 안 된다. */
function collectManifests(root: string, maxDepth = 6): Set<string> {
  const found = new Set<string>()
  const walk = (dir: string, depth: number): void => {
    if (depth > maxDepth || found.size >= MANIFEST_NAMES.size) return
    let ents: import('fs').Dirent[]
    try {
      ents = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of ents) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), depth + 1)
      } else if (MANIFEST_NAMES.has(e.name)) {
        found.add(e.name)
      }
    }
  }
  walk(root, 0)
  return found
}

/** 대상 폴더 트리에 pypi manifest가 있는지 (있을 때만 Python이 필요) */
export function hasPypiManifest(targetPath: string): boolean {
  const found = collectManifests(targetPath)
  return PYPI_MANIFESTS.some((m) => found.has(m))
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

/** 대상 폴더 트리에 java가 필요한 manifest(build.gradle/pom.xml)가 있는지 */
export function hasJavaManifest(targetPath: string): boolean {
  const found = collectManifests(targetPath)
  return JAVA_MANIFESTS.some((m) => found.has(m))
}

/** Gradle 버전 카탈로그(gradle/libs.versions.toml)를 쓰는 프로젝트인지.
 * 이런 프로젝트는 Gradle이 카탈로그 접근자 클래스를 생성해 컴파일하므로 javac(JDK)이
 * 필요하다. JRE만 있으면 "No Java compiler found"로 분석이 실패한다. */
export function hasGradleVersionCatalog(targetPath: string, maxDepth = 6): boolean {
  const walk = (dir: string, depth: number): boolean => {
    if (depth > maxDepth) return false
    let ents: import('fs').Dirent[]
    try {
      ents = readdirSync(dir, { withFileTypes: true })
    } catch {
      return false
    }
    for (const e of ents) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && walk(join(dir, e.name), depth + 1)) return true
      } else if (e.name === 'libs.versions.toml') {
        return true
      }
    }
    return false
  }
  return walk(targetPath, 0)
}

function depJavaDir(needJdk = false): string {
  // JRE와 JDK를 다른 폴더에 두어, 나중에 JDK가 필요해져도 기존 JRE와 섞이지 않게 한다
  return join(app.getPath('userData'), needJdk ? 'dep-jdk' : 'dep-java')
}

/** 내려받은 Temurin의 JAVA_HOME(최상위 jdk-* 폴더)을 찾는다 */
function findDownloadedJavaHome(needJdk = false): string | null {
  const base = depJavaDir(needJdk)
  try {
    for (const e of readdirSync(base, { withFileTypes: true })) {
      if (e.isDirectory() && existsSync(join(base, e.name, 'bin', 'java.exe'))) {
        return join(base, e.name)
      }
    }
  } catch {
    // 폴더 없음
  }
  return null
}

async function verifyJava(javaHome: string, needJdk = false): Promise<boolean> {
  try {
    await execFileP(join(javaHome, 'bin', 'java.exe'), ['-version'])
    // JDK가 필요하면 javac까지 있어야 쓸모가 있다 (JRE에는 없다)
    return !needJdk || existsSync(join(javaHome, 'bin', 'javac.exe'))
  } catch {
    return false
  }
}

/** gradle/maven 분석용 Java를 확보해 JAVA_HOME 경로를 돌려준다.
 * 시스템에 쓸 수 있는 java가 있으면 null(그대로 사용). 없으면 Temurin 11을 userData로
 * 1회 다운로드/해제한다. fosslight는 시스템 gradle을 쓰지 않고 프로젝트의 gradlew만
 * 실행하므로 Gradle 설치는 불필요하고 Java만 있으면 된다.
 * needJdk=true(버전 카탈로그 프로젝트)면 javac이 필요하므로 JRE(41MB) 대신
 * JDK(약 180MB)를 받는다. 큰 다운로드라 실제로 필요할 때만 호출해야 한다. */
export async function ensureJavaForGradle(
  pathEnv: string,
  onEvent: (e: ScanEvent) => void,
  needJdk = false
): Promise<string | null> {
  // JDK가 필요한데 시스템 java가 JRE뿐이면 시스템 것을 쓸 수 없다
  if (await toolExists('java', pathEnv)) {
    if (!needJdk || (await toolExists('javac', pathEnv))) return null // 시스템 java 사용
    onEvent({
      type: 'log',
      level: 'INFO',
      message:
        '이 프로젝트는 Gradle 버전 카탈로그를 사용해 Java 컴파일러(JDK)가 필요한데 ' +
        '시스템 Java에는 javac이 없습니다.'
    })
  }

  const cached = findDownloadedJavaHome(needJdk)
  if (cached && (await verifyJava(cached, needJdk))) return cached

  const dir = depJavaDir(needJdk)
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // 이전 잔여물 정리 실패는 무시
  }
  mkdirSync(dir, { recursive: true })
  const zip = join(dir, 'temurin11.zip')

  onEvent({
    type: 'log',
    level: 'INFO',
    message: needJdk
      ? '이 프로젝트(Gradle 버전 카탈로그)는 Java 17 JDK가 필요해 앱 전용 Temurin 17을 ' +
        '내려받습니다 (최초 1회, 약 182MB)...'
      : 'Java가 없어 앱 전용 Java 11(Temurin JRE)을 내려받습니다 (최초 1회, 약 41MB)...'
  })
  try {
    downloadAbort = new AbortController()
    await downloadToFile(needJdk ? TEMURIN17_JDK_URL : TEMURIN11_URL, zip, downloadAbort.signal)
    const tarExe = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
    await execFileP(tarExe, ['-xf', zip, '-C', dir], { windowsHide: true })
    rmSync(zip, { force: true })
  } catch (e) {
    onEvent({
      type: 'log',
      level: 'WARNING',
      message: `Java 다운로드/해제에 실패했습니다: ${(e as Error).message}`
    })
    return null
  } finally {
    downloadAbort = null
  }

  const home = findDownloadedJavaHome(needJdk)
  if (home && (await verifyJava(home, needJdk))) {
    onEvent({
      type: 'log',
      level: 'INFO',
      message: `앱 전용 Java(${needJdk ? '17 JDK' : '11 JRE'}) 준비 완료`
    })
    return home
  }
  onEvent({ type: 'log', level: 'WARNING', message: '앱 전용 Java 준비에 실패했습니다.' })
  return null
}

/** 대상 폴더 트리에 pom.xml이 있는지 (Maven 필요 판단) */
export function hasMavenManifest(targetPath: string): boolean {
  return collectManifests(targetPath).has('pom.xml')
}

/** 대상 폴더 트리에 Maven wrapper(mvnw)가 있는지 재귀로 확인.
 * mvnw가 있으면 래퍼가 Maven을 자체 조달하므로 Java만 있으면 된다. */
function hasMvnw(root: string, maxDepth = 6): boolean {
  const walk = (dir: string, depth: number): boolean => {
    if (depth > maxDepth) return false
    let ents: import('fs').Dirent[]
    try {
      ents = readdirSync(dir, { withFileTypes: true })
    } catch {
      return false
    }
    for (const e of ents) {
      if (e.isFile() && (e.name === 'mvnw' || e.name === 'mvnw.cmd')) return true
    }
    for (const e of ents) {
      if (e.isDirectory() && !SKIP_DIRS.has(e.name) && walk(join(dir, e.name), depth + 1)) return true
    }
    return false
  }
  return walk(root, 0)
}

function depMavenBinDir(): string | null {
  const base = join(app.getPath('userData'), 'dep-maven')
  const bin = join(base, `apache-maven-${MAVEN_VERSION}`, 'bin')
  return existsSync(join(bin, 'mvn.cmd')) ? bin : null
}

/** gradle과 달리 Maven은 mvnw가 없으면 시스템 mvn이 필요하다. 시스템 mvn이 없고
 * mvnw도 없으면 Apache Maven을 userData로 1회 다운로드/해제하고, 그 bin을 앞에 붙인
 * 새 PATH를 돌려준다. 필요 없거나(시스템 mvn/mvnw 존재) 실패하면 null. */
export async function ensureMaven(
  targetPath: string,
  pathEnv: string,
  onEvent: (e: ScanEvent) => void
): Promise<string | null> {
  if (await toolExists('mvn', pathEnv)) return null // 시스템 mvn 사용
  if (hasMvnw(targetPath)) return null // mvnw 래퍼가 Maven 자체 조달 (Java만 필요)

  const cached = depMavenBinDir()
  if (cached) return prependToPath(pathEnv, [cached])

  const base = join(app.getPath('userData'), 'dep-maven')
  try {
    rmSync(base, { recursive: true, force: true })
  } catch {
    // 이전 잔여물 정리 실패는 무시
  }
  mkdirSync(base, { recursive: true })
  const zip = join(base, 'maven.zip')

  onEvent({
    type: 'log',
    level: 'INFO',
    message: 'Maven이 없어 앱 전용 Apache Maven을 내려받습니다 (최초 1회, 약 8MB)...'
  })
  try {
    downloadAbort = new AbortController()
    await downloadToFile(MAVEN_URL, zip, downloadAbort.signal)
    const tarExe = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
    await execFileP(tarExe, ['-xf', zip, '-C', base], { windowsHide: true })
    rmSync(zip, { force: true })
  } catch (e) {
    onEvent({
      type: 'log',
      level: 'WARNING',
      message: `Maven 다운로드/해제에 실패했습니다: ${(e as Error).message}`
    })
    return null
  } finally {
    downloadAbort = null
  }

  const bin = depMavenBinDir()
  if (bin) {
    onEvent({ type: 'log', level: 'INFO', message: '앱 전용 Apache Maven 준비 완료' })
    return prependToPath(pathEnv, [bin])
  }
  onEvent({ type: 'log', level: 'WARNING', message: '앱 전용 Maven 준비에 실패했습니다.' })
  return null
}

// winget을 쓸 수 없는 환경(기업망 TLS 검사로 winget 인증서 고정 실패 등)에서 쓸
// Node.js를 풀어둘 위치. npm 내부 경로가 깊어(약 103자) 짧은 경로를 쓴다.
const NODE_BOOTSTRAP_DIR = join(process.env.LOCALAPPDATA ?? '', 'fosslight-node')

/** 앱이 직접 받아둔 Node.js 폴더 (없으면 null) */
function findBootstrappedNode(): string | null {
  try {
    for (const name of readdirSync(NODE_BOOTSTRAP_DIR)) {
      if (existsSync(join(NODE_BOOTSTRAP_DIR, name, 'node.exe'))) {
        return join(NODE_BOOTSTRAP_DIR, name)
      }
    }
  } catch {
    // 폴더 없음 — 아직 받은 적 없다
  }
  return null
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
  return findBootstrappedNode()
}

/** winget 없이 Node.js LTS를 공식 zip으로 받아 사용자 폴더에 푼다.
 * 기업망의 TLS 검사 프록시는 winget의 인증서 고정을 깨뜨려(0x8A15005E) winget을 아예
 * 쓸 수 없게 만드는데, 일반 HTTPS는 OS가 기업 루트 CA를 신뢰하므로 정상 동작한다.
 * 관리자 권한 불필요, 시스템 PATH도 건드리지 않고 스캔에만 쓴다. 실패하면 null. */
export async function bootstrapNode(onEvent: (e: ScanEvent) => void): Promise<string | null> {
  const cached = findBootstrappedNode()
  if (cached) return cached

  onEvent({
    type: 'log',
    level: 'INFO',
    message: 'winget을 사용할 수 없어 Node.js LTS를 직접 내려받습니다 (약 30MB, 몇 분 걸릴 수 있습니다)...'
  })

  const script = [
    "$ErrorActionPreference = 'Stop'",
    '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
    '$px = [Net.WebRequest]::GetSystemWebProxy()',
    '$px.Credentials = [Net.CredentialCache]::DefaultCredentials',
    '[Net.WebRequest]::DefaultWebProxy = $px',
    "$idx = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing",
    '$v = ($idx | Where-Object { $_.lts -ne $false } | Select-Object -First 1).version',
    '$name = "node-$v-win-x64"',
    '$zip = Join-Path $env:TEMP "$name.zip"',
    'Invoke-WebRequest -Uri "https://nodejs.org/dist/$v/$name.zip" -OutFile $zip -UseBasicParsing',
    `New-Item -ItemType Directory -Force -Path '${NODE_BOOTSTRAP_DIR}' | Out-Null`,
    `Expand-Archive -Path $zip -DestinationPath '${NODE_BOOTSTRAP_DIR}' -Force`,
    'Remove-Item $zip -Force',
    `Write-Output (Join-Path '${NODE_BOOTSTRAP_DIR}' $name)`
  ].join('; ')

  try {
    const { stdout } = await execFileP('powershell.exe', ['-NoProfile', '-Command', script], {
      maxBuffer: 10 * 1024 * 1024
    })
    const dir = stdout.trim().split(/\r?\n/).pop()?.trim() ?? ''
    if (dir && existsSync(join(dir, 'node.exe'))) {
      onEvent({ type: 'log', level: 'INFO', message: 'Node.js 준비 완료 (이번 분석에만 사용)' })
      return dir
    }
    onEvent({
      type: 'log',
      level: 'WARNING',
      message: 'Node.js를 받았지만 실행 파일을 찾지 못했습니다. npm 의존성 분석이 실패할 수 있습니다.'
    })
  } catch (e) {
    onEvent({
      type: 'log',
      level: 'WARNING',
      message:
        'Node.js 자동 확보에 실패했습니다: ' +
        `${(e as Error).message.split('\n')[0]} — https://nodejs.org 에서 직접 설치해주세요.`
    })
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
  // URL/압축 스캔은 프로젝트가 하위 폴더로 풀리므로 재귀로 manifest를 찾는다.
  const entries = collectManifests(targetPath)

  const needed = new Map<string, ToolSpec>()
  for (const [manifest, spec] of Object.entries(MANIFEST_TOOLS)) {
    if (entries.has(manifest)) {
      needed.set(spec.tool, spec)
      if (spec.needsJava) needed.set(JAVA_SPEC.tool, JAVA_SPEC)
    }
  }

  const missing: ToolSpec[] = []
  for (const spec of needed.values()) {
    // java/mvn은 winget이 아니라 ensureJavaForGradle/ensureMaven이 확보한다.
    // python은 번들 Python 3.12가 pypi venv를 스스로 만들므로 설치가 필요 없다.
    if (spec.tool === 'java' || spec.tool === 'mvn' || spec.tool === 'python') continue
    if (!(await toolExists(spec.tool, pathEnv))) missing.push(spec)
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
        message:
          spec.manualHint ??
          `${spec.label}은(는) 자동 설치를 지원하지 않습니다. 직접 설치 후 다시 스캔해주세요.`
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
