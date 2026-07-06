# FOSSLight Scanner GUI 개발 문서

새로 합류한 개발자를 위한 문서 모음입니다. 순서대로 읽는 것을 권장합니다.

| 문서 | 내용 |
|---|---|
| [01. 아키텍처 개요](01-architecture.md) | 전체 구조, 기술 스택, 디렉토리 구조, 설계 결정 배경 |
| [02. 스캔 실행 흐름](02-scan-flow.md) | 스캔 시작→완료까지의 상세 플로우차트, 취소/오류/도구 자동 설치 흐름 |
| [03. Python 백엔드](03-backend.md) | 래퍼 구조, NDJSON 프로토콜 명세, gui_result.json 스키마, fosslight 함정 목록 |
| [04. 프론트엔드 (Electron/React)](04-frontend.md) | main/preload/renderer 구조, IPC 채널, 페이지/스토어/유틸 상세 |
| [05. 빌드와 릴리스](05-build-and-release.md) | 개발 환경 구성, PyInstaller/electron-builder 빌드, 릴리스 절차 |
| [06. 배포물 구성과 설치 용량](06-distribution-contents.md) | 인스톨러 포함 항목, 설치 시 생성되는 것, 1GB 용량의 내역과 설계 배경 |

## 빠른 시작

```powershell
git clone -b newapp https://github.com/fosslight/fosslight_scanner_gui.git
cd fosslight_scanner_gui
npm install
npm run build:backend   # Python venv + fosslight 설치 + PyInstaller (최초 1회, 10분+)
npm run dev             # 개발 모드 실행
```

요구 사항: Node.js 20+, Python 3.12 (`py -3.12`로 실행 가능해야 함)

## 핵심 개념 한 장 요약

- **UI는 Electron(React), 분석 엔진은 Python(fosslight-scanner)** — 스캔마다 Electron이
  백엔드 프로세스를 spawn하고, stdout의 NDJSON 이벤트로 진행 상황을 받는다.
- 백엔드는 fosslight 리포트(xlsx)를 **`gui_result.json`으로 정규화**해서 출력 폴더에 남기고,
  렌더러는 그 JSON만 읽는다. fosslight 출력 형식이 바뀌면 백엔드 래퍼만 고치면 된다.
- 최종 사용자 배포는 **NSIS 인스톨러 하나** — Python 런타임과 fosslight 전체가
  PyInstaller onedir로 동결되어 리소스로 포함된다.
