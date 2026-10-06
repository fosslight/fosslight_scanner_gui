# FOSSLight Scanner GUI 개발 문서

새로 합류한 개발자를 위한 문서 모음입니다. 순서대로 읽는 것을 권장합니다.

| 문서 | 내용 |
|---|---|
| [01. 아키텍처 개요](01-architecture.md) | 전체 구조, 기술 스택, 디렉토리 구조, 설계 결정 배경 |
| [02. 스캔 실행 흐름](02-scan-flow.md) | 스캔 시작→완료까지의 상세 플로우차트, 취소/오류/도구 자동 설치 흐름 |
| [03. Python 백엔드](03-backend.md) | 래퍼 구조, NDJSON 프로토콜 명세, gui_result.json 스키마, fosslight 함정 목록 |
| [04. 프론트엔드 (Electron/React)](04-frontend.md) | main/preload/renderer 구조, IPC 채널, 페이지/스토어/유틸 상세 |
| [05. 빌드와 릴리스](05-build-and-release.md) | 개발 환경 구성, 백엔드 번들, electron-builder 빌드, 릴리스 절차 |
| [06. 배포물 구성과 설치 용량](06-distribution-contents.md) | 인스톨러 포함 항목, 설치 시 생성되는 것, 첫 실행 캐시 |

## 빠른 시작

```powershell
git clone https://github.com/fosslight/fosslight_scanner_gui.git
cd fosslight_scanner_gui
npm install
npm run build:backend   # 독립 Python 3.12 + fosslight 설치 (최초 1회, 설치본용)
npm run dev             # 개발 모드 실행
```

요구 사항: Node.js 20+, Python 3.12.

개발 모드의 스캔은 `python-backend/.venv/Scripts/python.exe`를 사용합니다. 이 venv는 `build:backend`가 만들지 않으므로, 스캔을 돌리려면 Python 3.12 venv를 그 경로에 만들고 `python-backend/requirements.txt`를 설치해야 합니다. UI만 볼 때는 venv 없이도 `npm run dev`가 뜨고, 스캔 실행만 실패합니다.

## 핵심 개념 한 장 요약

- **UI는 Electron(React), 분석 엔진은 Python(fosslight-scanner)** — 스캔마다 Electron이
  백엔드 프로세스를 spawn하고, stdout의 NDJSON 이벤트로 진행 상황을 받는다.
- 배포 백엔드는 PyInstaller 실행 파일이 아니다. **재배포 가능한 CPython 3.12**에
  fosslight를 pip 설치한 뒤 `backend_main.py`를 그 인터프리터로 실행한다.
  설치본 경로는 `resources/backend/python/python.exe`이다.
- 백엔드는 fosslight 리포트(xlsx)를 **`gui_result.json`으로 정규화**한다. 이 파일은
  사용자 출력 폴더가 아니라 `%APPDATA%\fosslight-scanner-gui\gui_result.json`에 남는다.
  렌더러는 결과 이벤트에 실린 JSON을 바로 쓰고, 앱을 다시 열 때 그 파일을 읽는다.
- 최종 사용자 배포는 **NSIS 인스톨러 하나**다. `python-backend/pybuild`가
  extraResources로 `resources/backend/`에 들어간다.
