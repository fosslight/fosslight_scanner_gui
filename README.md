# FOSSLight Scanner GUI

[FOSSLight Scanner](https://github.com/fosslight/fosslight_scanner)를 위한 Windows 데스크톱 앱입니다.
인스톨러 하나로 설치하면 별도의 Python 설치 없이 소스 코드 / 의존성 / 바이너리 오픈소스 분석을
실행하고, 결과를 GUI에서 확인할 수 있습니다.

## 주요 기능

- **Overview** — 분석 결과 요약, 라이선스 위험도 분포/상위 라이선스 차트, 고위험 라이선스 경고
- **Scan Results** — Source / Dependency / Binary 별 검출 항목 테이블 (검색·정렬·상세 확장)
- **Risk > License** — 라이선스별 위험도(Permissive/Weak·Strong Copyleft/Restricted)와 한국어 의무사항
- **Risk > Vulnerability** — OSS 이름+버전 기반 NVD 취약점 검색 링크
- **스캔 실행** — 분석 대상(폴더 / 압축파일 / URL), 분석 유형, 제외 경로, 리포트 저장 위치 지정, 실시간 로그, 취소
  - 압축파일: zip, tar.gz, tgz, tar, jar, whl 등 (자동 해제 후 분석)
  - URL: git 저장소 URL(clone) 또는 압축파일 다운로드 URL

리포트 원본(xlsx, yaml)은 지정한 저장 위치에 함께 생성됩니다.

> 📚 **개발자 문서**: 아키텍처, 스캔 흐름도, 백엔드/프론트엔드 상세, 빌드·릴리스 절차는
> [docs/](docs/README.md)를 참고하세요.

## 아키텍처

```
Electron (React + TypeScript)
  └─ spawn ─> fosslight-backend.exe (PyInstaller로 동결한 Python 백엔드)
                ├─ fosslight_scanner.run_main() 호출
                ├─ stdout: NDJSON 진행 이벤트 (phase/log/error/result)
                └─ 출력 폴더: fosslight 리포트 + gui_result.json (정규화 결과)
```

- `python-backend/src/backend_main.py` — 스캔 래퍼 (NDJSON 프로토콜)
- `python-backend/src/normalize_report.py` — xlsx 리포트 → `gui_result.json` 정규화
- `src/main/scanRunner.ts` — 백엔드 스폰/취소(프로세스 트리 kill)
- `python-backend/RECON.md` — fosslight v2.1.25 출력 구조 실측 문서

## 개발 환경

요구 사항: Node.js 20+, Python 3.12 (백엔드 빌드/개발 실행용)

```powershell
npm install
npm run build:backend   # venv 생성 + fosslight 설치 + PyInstaller 빌드 (최초 1회, 오래 걸림)
npm run dev             # 개발 모드 (백엔드는 venv Python으로 직접 실행)
```

## 인스톨러 빌드

```powershell
npm run dist            # 백엔드 빌드 + 앱 빌드 + NSIS 인스톨러
npm run dist:app-only   # JS만 변경 시 (PyInstaller 생략)
```

결과물: `dist/fosslight-scanner-gui-<버전>-setup.exe`
(백엔드에 scancode-toolkit이 포함되어 인스톨러가 수백 MB로 큽니다)

## 알려진 제약

- **코드 서명 없음** — 설치 시 Windows SmartScreen 경고가 표시될 수 있습니다.
  "추가 정보 → 실행"으로 진행하세요.
- **Dependency 분석**은 분석 대상 프로젝트의 패키지 매니저(npm, mvn, gradle 등)가 필요합니다.
  폴더 스캔 시 없으면 **winget으로 자동 설치**합니다 (`src/main/depInstaller.ts`).
  압축파일/URL 대상은 해제 전까지 manifest를 알 수 없어 경고로만 안내합니다.
- **git 저장소 URL 분석**은 시스템에 git이 설치되어 있어야 합니다 (없으면 경고 표시).
  npm registry의 tgz URL은 fosslight v2.1.25의 URL 변형 버그로 실패할 수 있습니다.
- 취약점 상세(CVE, CVSS)는 표시하지 않으며 NVD 검색 링크만 제공합니다 (오프라인 동작 보장).
- `-f` 포맷의 첫 항목이 excel이 아니면 fosslight v2.1.25에서 빈 결과가 생성되는 이슈가 있어,
  백엔드는 항상 `excel, yaml` 순서로 리포트를 생성합니다.
