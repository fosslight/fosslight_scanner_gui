# 03. Python 백엔드

코드: `python-backend/src/backend_main.py`, `python-backend/src/normalize_report.py`
실측 기록: [python-backend/RECON.md](../python-backend/RECON.md)

배포 시 이 스크립트는 PyInstaller로 얼리지 않는다. `scripts/build-backend.ps1`이
독립 CPython 3.12의 `python.exe`로 `backend_main.py`를 실행할 수 있게
`python-backend/pybuild/`에 복사한다. 개발 모드는 `python-backend/.venv`의 Python으로
`python-backend/src/backend_main.py`를 실행한다.

## 역할

Electron이 스캔마다 spawn하는 CLI 프로세스입니다. 하는 일은 아래와 같다.

1. `fosslight_scanner.run_main()` 호출
2. 진행 상황을 **stdout NDJSON**으로 스트리밍
3. fosslight의 xlsx 리포트를 **gui_result.json**으로 정규화
4. Dependency 스캔 전에 `--prepare`로 URL/압축만 받아 폴더로 풀기
5. `--validate-git-ref`로 브랜치·태그 존재 확인, `--versions`로 포함 스캐너 버전 출력

## CLI 인터페이스

스캔:

```
python.exe backend_main.py (--path <폴더|압축파일> | --url <git/다운로드 URL>)
                           --modes all|source,dependency,binary
                           [--exclude a;b;c]
                           [--kb-url URL] [--kb-token TOKEN]
                           --output <폴더>
                           [--result-file <gui_result.json 경로>]
                           [--analyzed-path <리포트에 적을 원래 경로>]
                           [--debug-source]
```

Electron은 git 브랜치/태그를 URL 뒤에 붙인다. `https://github.com/org/repo;branch=main`
또는 `;tag=v1.2.3`.

숨은 모드:

| 인자 | 용도 |
|---|---|
| `--prepare --dest <폴더> (--url \| --path)` | 분석 없이 다운로드 또는 압축 해제. `prepared` 이벤트만 내고 종료 |
| `--validate-git-ref --url <url> --ref <name>` | 브랜치/태그 확인. JSON 한 줄로 결과 |
| `--versions` | 번들된 fosslight 패키지 버전 |
| `--debug-source` | 동결 시절 진단용으로 남아 있는 숨은 플래그 |

## 시동 시퀀스 (순서가 중요)

```python
sys.stdout.reconfigure(encoding="utf-8")  # ① Windows 파이프 기본 cp949 → 한글 깨짐 방지
REAL_STDOUT = sys.stdout                  # ② NDJSON 전용 채널 확보
sys.stdout = sys.stderr                   # ③ 이후 모든 print/로거 출력은 stderr로
# ... fosslight 임포트는 반드시 이 뒤에 (로거 핸들러가 스트림에 바인딩되므로)

if __name__ == "__main__":
    multiprocessing.freeze_support()      # scancode가 multiprocessing을 씀
    main()
```

- fosslight 로거("FOSSLight")에 `NdjsonLogHandler`를 달아 로그를 이벤트로 변환한다.
  핸들러를 먼저 달면 fosslight `init_log`의 `hasHandlers` 분기가 건너뛰어지므로
  **`logger.setLevel(INFO)`를 직접** 지정해야 진행 로그가 나온다.
- `os.chdir(출력폴더)`: fosslight가 임시 폴더를 cwd에 만들기 때문.
- 스캔 시작 시 `SCANCODE_CACHE`가 없으면
  `%LOCALAPPDATA%\FOSSLightScanner\scancode`로 잡고, 라이선스 인덱스 캐시가 없으면
  그 자리에서 한 번 만든다. 설치 파일에는 이 캐시를 넣지 않는다.

## run_main 호출 규약

```python
ok = run_main(
    mode_list,          # ["all"] 또는 ["source", ...]
    [args.path or ""],
    [],                 # dep_arguments
    args.output,
    ["excel"],          # 첫 항목은 excel. yaml은 요청하지 않음
    args.url or "",
    hide_progressbar=True,
    num_cores=num_cores,
    kb_url=args.kb_url,
    kb_token=args.kb_token,
    path_to_exclude=exclude_list,
)
```

호출 전에 `check_upstream_compatibility()`로 앞 6개 위치 인자와
`hide_progressbar`, `num_cores`, `kb_url`, `kb_token`, `path_to_exclude`가 그대로인지 본다.
달라졌으면 WARNING 로그만 남기고 스캔은 계속한다. 여기서 예외를 내지 않는다.

## Windows 정리 실패와 복구 (salvage_temp_reports)

fosslight는 스캔 후 임시 폴더를 `shutil.rmtree`로 지우는데 Windows에서 실패할 수 있다.
래퍼는 `run_main`이 반환된 뒤, 성공 여부와 관계없이 `salvage_temp_reports()`를 호출한다.

- 출력 폴더로 `chdir`해 cwd 잠금을 푼다.
- 이번 스캔 시작 이후에 생긴 `.fosslight_temp_*`에 남은 `fosslight_report_*`를 출력 폴더로 옮긴다.
- `_rmtree_force`는 읽기 전용을 풀고, 잠금이면 최대 5회 재시도한다.
- 출력 폴더의 `temp_extract_*`도 같은 방식으로 지운다.

`NdjsonLogHandler`는 `WinError 32`이면서 경로에 `temp_extract_`, `.fosslight_temp_`,
`fosslight_raw_data`가 들어 있는 WARNING을 "앱이 대신 정리합니다" INFO로 바꾼다.
그 외 WinError 32는 그대로 전달한다.

git이 없을 때 fosslight가 남기는 `Git clone error` + `WinError 2`도 INFO로 바꾼다.
압축 파일 URL은 직접 다운로드로 이어지기 때문이다.

## 성공/실패 판정

```python
if ok is False:
    raise RuntimeError("다운로드에 실패했습니다..." if args.url
                       else "스캔이 실패했습니다...")
result_file, report, schema_warnings = normalize_report(...)
```

`run_main`이 `False`이면 xlsx가 있어도 실패다. `True`이고 xlsx가 없으면 빈 결과로
`gui_result.json`을 쓴 뒤 종료 코드 0이다. 시트 이름이 모두 바뀌어 아는 시트가 없으면
`normalize_report`가 `RuntimeError`를 내고 종료 코드 1이다.

## gui_result.json 스키마

`normalize_report()`가 출력 폴더의 최신 `fosslight_report_*.xlsx`를 파싱한다.
Electron은 `--result-file`로 저장 경로를 `%APPDATA%\fosslight-scanner-gui\gui_result.json`에 고정한다.

시트 매핑: `SRC_FL_Source` → source, `BIN_FL_Binary` → binary, `DEP_FL_Dependency` → dependency.
`Scanner Info` 시트는 `toolInfo`로 옮긴다.

```jsonc
{
  "scanDate": "2026-07-06T01:23:45",
  "analyzedPath": "D:\\proj 또는 원래 URL/압축 경로",
  "modes": ["all"],
  "toolInfo": { "Tool information": "...", "...": "..." },
  "items": {
    "source":     [ /* OssItem[] */ ],
    "dependency": [ ... ],
    "binary":     [ ... ]
  }
}
```

OssItem (license만 배열, 나머지 문자열):

| 필드 | 원본 xlsx 컬럼 | 비고 |
|---|---|---|
| `name` / `version` | OSS Name / OSS Version | dependency는 `npm:accepts` 형태 프리픽스가 붙을 수 있음 |
| `license` | License | 쉼표 구분 → 배열. 화면 표시 전에 렌더러가 SPDX 짧은 이름으로 맞춘다 |
| `downloadLocation` / `homepage` / `copyright` / `comment` | 동명 컬럼 | |
| `exclude` | Exclude | 값 존재 여부 → bool |
| `paths` | Source Path / Binary Path / Package URL | 시트별로 다른 컬럼 |

예상 컬럼이 없거나, 행은 있는데 OSS 이름이 전부 비어 있으면 실패로 만들지 않고
WARNING 로그를 남긴다. 아는 시트가 하나도 없는 경우만 예외다.

## 엔진 버전

`scripts/build-backend.ps1`과 `requirements.txt`의 하한:

- `fosslight-scanner>=2.1.32`
- `fosslight-dependency>=4.1.56`
- `fosslight-util>=2.2.16`

이보다 낮으면 gradle의 WinError 2, 깊은 경로의 pypi, Microsoft Store python stub,
다운로드 타임아웃, helm 차트 누락, 한글 경로의 git 출력 유실이 다시 난다.
빌드는 `--upgrade-strategy eager`로 하한을 만족하는 최신을 설치한다.

## 래퍼가 아직 피하는 상류 동작

1. `-f`의 첫 포맷이 excel이 아니면 빈 결과가 나던 문제가 있어, 래퍼는 항상 `["excel"]`만 넘긴다.
2. Windows에서 임시 폴더 삭제가 실패하면 리포트가 `.fosslight_temp_*`에 남을 수 있어 `salvage_temp_reports()`가 옮긴다.
3. URL 다운로드에 실패하면 `run_main`이 `False`를 반환하고, 래퍼는 그때 실패로 끝낸다.
