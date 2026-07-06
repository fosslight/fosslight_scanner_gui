# FOSSLight GUI Python 백엔드 빌드 스크립트
# venv 준비 → 의존성 설치 → PyInstaller onedir 빌드
$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\..\python-backend"

if (-not (Test-Path .venv)) {
    py -3.12 -m venv .venv
}
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m PyInstaller fosslight_backend.spec --noconfirm --clean

Write-Host "빌드 완료: python-backend\dist\fosslight-backend"
