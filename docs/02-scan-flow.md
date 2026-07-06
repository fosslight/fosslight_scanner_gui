# 02. 스캔 실행 흐름

스캔 버튼을 누른 순간부터 결과 화면까지의 전체 흐름입니다.
코드 기준: `src/renderer/src/pages/ScanPage.tsx` → `src/main/ipc.ts` →
`src/main/depInstaller.ts` → `src/main/scanRunner.ts` → `python-backend/src/backend_main.py`

## 전체 플로우차트

```mermaid
flowchart TD
    A["사용자: 분석 대상 선택<br/>(폴더 / 압축파일 / URL) + 스캔 시작"] --> B["Renderer: store.startScan()<br/>window.api.startScan(cfg)"]
    B --> C{"Main(ipc.ts):<br/>이미 스캔 중?"}
    C -- 예 --> C1["{ok:false} 반환"]
    C -- 아니오 --> D["getFreshPath()<br/>레지스트리에서 최신 PATH 조회"]
    D --> E{"폴더 대상이고<br/>dependency 모드 포함?"}
    E -- 아니오 --> H
    E -- 예 --> F["checkMissingTools():<br/>manifest 감지 + where.exe로 도구 확인"]
    F --> G{"누락 도구 있음?"}
    G -- 아니오 --> H
    G -- 예 --> G1["phase: installing 이벤트<br/>installTools(): winget 무인 설치<br/>(진행 로그 스트리밍)"]
    G1 --> G2["getFreshPath() 재조회<br/>(설치로 바뀐 PATH 반영)"]
    G2 --> H["scanRunner.startScan():<br/>fosslight-backend.exe spawn<br/>(env.PATH = 최신 PATH)"]

    H --> I["Backend: NDJSON 이벤트 스트림<br/>phase: starting → scanning"]
    I --> J["run_main() 실행<br/>압축이면 자동 해제 / URL이면 다운로드<br/>source·dependency·binary 분석"]
    J --> K["phase: normalizing<br/>salvage_temp_reports()<br/>normalize_report() → gui_result.json"]
    K --> L["result 이벤트 (resultFile 경로)"]
    L --> M["Main: 최근 스캔 목록에 등록<br/>done 이벤트 (exitCode)"]
    M --> N["Renderer: scanStatus=success<br/>loadReport()로 결과 자동 로드<br/>→ 모든 페이지 갱신"]
```

## NDJSON 이벤트 프로토콜 (Backend stdout → Main)

백엔드 stdout은 **순수 NDJSON 채널**입니다 (한 줄 = 한 이벤트, UTF-8).
fosslight의 콘솔 출력은 stderr로 우회시키고, JSON 파싱에 실패하는 줄은 무시합니다.

| 이벤트 | 필드 | 의미 |
|---|---|---|
| `phase` | `phase: starting\|scanning\|normalizing` | 단계 전환 (UI 스테퍼) |
| `log` | `level`, `message` | fosslight 로거 출력 전달 (로그 콘솔 표시) |
| `error` | `message`, `traceback` | 치명 오류 (빨간 배너) |
| `result` | `resultFile` | 정규화 결과 파일 경로 (성공 시 1회) |
| `done` | `exitCode` | **Main이 프로세스 종료 시 합성** (백엔드가 보내지 않음) |

`installing` phase는 Main(depInstaller)이 직접 보냅니다 — 백엔드 실행 전 단계이기 때문.

## 도구 자동 설치 흐름 (depInstaller.ts)

```mermaid
flowchart TD
    A["manifest 감지<br/>(package.json→npm, pom.xml→mvn+java, ...)"] --> B["where.exe로 각 도구 존재 확인<br/>(레지스트리 최신 PATH 기준)"]
    B --> C{누락?}
    C -- 없음 --> Z[스캔 진행]
    C -- 있음 --> D{"wingetId 있음?<br/>(Flutter는 null)"}
    D -- 아니오 --> D1["WARNING: 수동 설치 안내"] --> Z
    D -- 예 --> E["winget install --id ... -e --silent<br/>--accept-*-agreements --disable-interactivity"]
    E --> F{"종료 코드 0 또는<br/>이미 설치됨(0x8A15002B)?"}
    F -- 예 --> G["설치 완료 로그"] --> H["PATH 재조회 후 스캔 진행"]
    F -- 아니오 --> I["WARNING: 설치 실패<br/>(스캔은 계속 — 해당 분석만 실패 가능)"] --> H
```

- 설치 실패는 스캔을 막지 않습니다. 의존성 분석만 실패할 수 있고 경고로 안내합니다.
- **압축파일/URL 대상은 사전 감지 불가** (해제/다운로드 전) → 백엔드의 경고 이벤트로만 안내.
- 설치 후 앱 재시작이 필요 없는 이유: spawn 시 `env.PATH`를 레지스트리에서
  새로 읽은 값으로 넘기기 때문 (`getFreshPath()`).

## 취소 흐름

```mermaid
flowchart LR
    A["취소 버튼<br/>(confirm 후)"] --> B["store.markCancelled()<br/>window.api.cancelScan()"]
    B --> C["Main: sessionCancelled=true<br/>cancelInstall() — winget 트리 kill<br/>cancelScan() — 백엔드 트리 kill"]
    C --> D["taskkill /PID n /T /F<br/>(scancode multiprocessing 자식 포함)"]
    D --> E["done 이벤트 (exitCode≠0)<br/>Renderer는 cancelled 상태 유지"]
```

- 프로세스 **트리** 전체를 죽이는 것이 중요합니다 — scancode가 multiprocessing
  워커를 여러 개 만들기 때문. (`/T` 플래그)
- 취소 후 남는 부분 출력 파일은 무해합니다. `gui_result.json`은 마지막에 쓰이므로
  "이 파일이 없으면 미완료 스캔"으로 판별됩니다.

## 성공/실패 판정 (중요)

fosslight의 `run_main` 반환값은 신뢰할 수 없습니다 (스캔 성공 후 임시 파일 정리
예외에도 False 반환). 백엔드 래퍼의 실제 판정 규칙:

1. `Download failed` 로그 감지 → **실패** ("다운로드에 실패했습니다")
2. 이번 스캔에서 생성된 `fosslight_report_*.xlsx`가 출력 폴더에 존재 → **성공**
   (`run_main`이 False여도)
3. 리포트도 없고 run_main이 False → **실패**
4. 리포트가 없지만 run_main이 True → **0건 성공** (검출 없음 — fosslight는 0건이면
   리포트 파일 자체를 안 만듦)

상세 근거는 [03. Python 백엔드](03-backend.md)와 [RECON.md](../python-backend/RECON.md) 참고.

## 오류가 사용자에게 보이는 방식

| 상황 | UI |
|---|---|
| `error` 이벤트 / exit≠0 | 스캔 폼의 빨간 배너 (`errorMessage`) |
| `WARNING` 로그 중 "설치되어 있지 않아" 포함 | 스캔 페이지 상단 앰버 배너 (`warnings`) |
| 일반 log 이벤트 | 진행 화면의 로그 콘솔 (최근 500줄) |
| 취소 | 회색 "스캔이 취소되었습니다" 배너 |
