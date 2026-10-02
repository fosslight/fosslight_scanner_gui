# Type B 백엔드 빌드: PyInstaller 동결 대신, 재배포 가능한 실제 Python 3.12에
# fosslight-scanner를 pip install 한 것을 그대로 번들한다.
# 이 하나의 Python이 FOSSLight 엔진 실행 + pypi venv 생성을 모두 담당한다.
$ErrorActionPreference = "Stop"

$backend = "$PSScriptRoot\..\python-backend"
$pybuild = "$backend\pybuild"
$python = "$pybuild\python\python.exe"

# 재배포 가능 CPython 3.12 (python-build-standalone, install_only: python.exe+stdlib+pip+venv)
$pyUrl = "https://github.com/astral-sh/python-build-standalone/releases/download/20260718/" +
         "cpython-3.12.13%2B20260718-x86_64-pc-windows-msvc-install_only.tar.gz"
$tarExe = "$env:SystemRoot\System32\tar.exe"

if (-not (Test-Path $python)) {
    Write-Host "독립 Python 3.12 다운로드/해제..."
    Remove-Item -Recurse -Force $pybuild -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force $pybuild | Out-Null
    $tgz = "$pybuild\python.tar.gz"
    Invoke-WebRequest -Uri $pyUrl -OutFile $tgz
    & $tarExe -xf $tgz -C $pybuild
    Remove-Item $tgz -Force
}

Write-Host "fosslight-scanner 설치 (엔진)..."
# Type B는 PyInstaller가 필요 없으므로 requirements.txt(pyinstaller 포함) 대신
# 엔진만 설치해 번들을 슬림하게 유지한다.
& $python -m pip install --upgrade pip
# 최소 버전: GUI의 Windows 보정(몽키패치)을 걷어낸 근거가 된 상류 수정이 들어간 버전.
# 이보다 낮으면 gradle(WinError 2)·깊은 경로 pypi·MS Store python·다운로드 타임아웃
# 문제가 다시 생긴다. dependency 4.1.56은 helm 의존 차트 누락·NuGet CPM 중단(4.1.51~55 회귀),
# util 2.2.16은 한글 경로에서 git 출력이 사라지는 문제를 고친 버전이다.
& $python -m pip install --upgrade --upgrade-strategy eager "fosslight-scanner>=2.1.32" "fosslight-dependency>=4.1.56" "fosslight-util>=2.2.16"

# 백엔드 스크립트를 번들 폴더로 복사 (electron-builder가 pybuild 통째로 담는다)
Copy-Item "$backend\src\backend_main.py", "$backend\src\normalize_report.py" "$pybuild\" -Force

# __pycache__ 정리 (배포물 슬림화)
Get-ChildItem -Recurse -Directory -Filter "__pycache__" "$pybuild\python" |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "빌드 완료: python-backend\pybuild (python\python.exe + backend_main.py)"
