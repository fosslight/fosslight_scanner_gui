# fosslight-scanner v2.1.25 출력 구조 조사 결과 (Phase 0)

## run_main 시그니처

```
run_main(mode_list, path_arg, dep_arguments, output_file_or_dir, file_format,
         url_to_analyze, db_url, hide_progressbar=False, keep_raw_data=False,
         num_cores=-1, correct_mode=True, correct_fpath='', ui_mode=False,
         path_to_exclude=[], selected_source_scanner='all',
         source_write_json_file=False, source_print_matched_text=False,
         source_time_out=120, kb_url='', kb_token='', binary_simple=False,
         recursive_dep=False)
```

## 주의 사항 (실측)

- **`file_format`의 첫 항목은 반드시 `excel`이어야 함.** `["yaml"]` 단독 지정 시
  내부 raw 파일(.xlsx)과 포맷 불일치로 source/binary/dependency 분석이 모두 빈 결과가 됨.
  `["excel", "yaml"]`은 정상 동작.
- `--ui`(ui_mode) JSON은 exclude 플래그가 없고 스캔한 전체 파일(node_modules 포함)이
  나열되어 잡음이 많음 → **파싱 소스로는 xlsx 리포트를 사용**.
- 리포트에 Vulnerability 컬럼 없음 → NVD 링크는 앱에서 OSS 이름+버전으로 검색 URL 생성.
- 출력 파일명: `fosslight_report_all_<yymmdd_hhmm>.xlsx` (mode에 따라 all/src/bin/dep).

## xlsx 시트/컬럼 (v2.1.25 실측)

- `Scanner Info`: 도구 버전 등 메타데이터 (key-value)
- `SRC_FL_Source`: ID, Source Path, OSS Name, OSS Version, License, Download Location,
  Homepage, Copyright Text, Exclude, Comment
- `BIN_FL_Binary`: SRC 컬럼 + TLSH, SHA1 (Binary Path)
- `DEP_FL_Dependency`: ID, Package URL, OSS Name, OSS Version, License, Download Location,
  Homepage, Copyright Text, Exclude, Comment, Depends On
- License 컬럼은 쉼표 구분 문자열 (예: "BSD-3-Clause,MIT,ISC")
- Exclude 컬럼: 제외 시 "Exclude" 유사 문자열/O 표기, 아니면 빈 값

## PyInstaller 동결 트러블슈팅 (실측)

- **PyInstaller 6.21+ 필요**: 6.11은 numpy 2.5의 `numpy._core._exceptions` lazy import를 놓침.
- **`rfc3987_syntax`, `lark`**: jsonschema 경유 의존 — `.lark` 문법 데이터 파일이 필요해 collect_all 대상.
- **`typecode_libmagic`, `extractcode_7z`, `extractcode_libarchive`**: scancode의
  location-provider 플러그인. `copy_metadata`만으로는 entry point 탐색 후 임포트가
  실패하므로(ModuleNotFoundError) 모듈 본체도 `collect_all`에 포함해야 함.
  누락 시 증상: source 분석만 "[WinError 2] 파일을 찾을 수 없습니다"로 조용히 실패.
- fosslight 로거("FOSSLight")에 핸들러를 미리 달면 init_log의 hasHandlers 분기가
  건너뛰어지므로 래퍼에서 `setLevel(INFO)`를 직접 지정해야 진행 로그가 전달됨.

## 압축파일/URL 입력 관련 (실측)

- run_main은 `-p`에 압축파일 경로를 주면 cwd에 `temp_extract_*`로 자동 해제 후 분석,
  `url_to_analyze`(-w)로 git clone/wget 다운로드를 자체 처리함. 래퍼는 전달만 하면 됨.
- **Windows 정리 실패 연쇄**: git clone의 `.git` 읽기 전용 파일, 의존성 분석 venv의
  파일 잠금 때문에 fosslight의 `shutil.rmtree`가 실패 →
  (a) 최종 리포트가 `.fosslight_temp_*`에 남아 출력 폴더로 이동 안 됨 (debug 레벨로 삼켜짐),
  (b) run_main이 스캔 성공 후에도 False 반환.
  → 래퍼의 `salvage_temp_reports()`가 리포트 회수 + 임시/해제 폴더 강제 정리(재시도 포함),
  성패 판정은 run_main 반환값이 아니라 "이번 스캔에서 생성된 리포트 존재 여부"로 함.
- 검출 0건이면 fosslight가 최종 리포트 파일을 아예 안 만듦 → 빈 결과로 정상 처리.
- URL 다운로드 실패는 run_main이 True를 반환하므로 "Download failed" 로그 감지로 판정.
- npm registry URL(예: registry.npmjs.org/...tgz)은 fosslight의 URL 변형 버그로 실패함
  (이름/확장자 중복 생성). GitHub 저장소 URL과 일반 압축 다운로드 URL은 정상.
- Windows 파이프 stdout 기본 인코딩이 cp949라 한글 NDJSON이 깨짐 →
  래퍼 시작 시 `sys.stdout.reconfigure(encoding="utf-8")` 필수.

## NVD 검색 URL (2026-07 실측)

- 구형 `https://nvd.nist.gov/vuln/search/results?...&query=` 는 SPA 개편으로
  리다이렉트되며 검색어가 유실됨.
- 새 형식: `https://nvd.nist.gov/vuln/search#/nvd/home?keyword=<검색어>&resultType=records`
- 링크는 백엔드가 아닌 **렌더러**(`src/renderer/src/utils/nvdLink.ts`)에서 생성 —
  기존 gui_result.json도 최신 형식으로 열리고, NVD가 또 바뀌어도 앱만 업데이트하면 됨.
