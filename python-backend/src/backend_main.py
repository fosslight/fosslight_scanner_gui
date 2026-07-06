# FOSSLight Scanner GUI 백엔드 래퍼
# Electron이 spawn하여 실행. stdout으로 NDJSON 이벤트를 내보내고,
# 스캔 완료 후 정규화된 gui_result.json을 출력 디렉토리에 기록한다.
import argparse
import glob
import json
import logging
import multiprocessing
import os
import shutil
import stat
import sys
import time
import traceback

# NDJSON 채널 확보: 이후의 모든 print/로거 stdout 출력은 stderr로 보내고,
# 이벤트는 원본 stdout으로만 내보낸다. (fosslight 임포트 전에 수행해야
# 로거 핸들러가 리다이렉트된 스트림에 바인딩됨)
# 파이프 stdout은 Windows에서 기본 cp949라 한글이 깨지므로 utf-8로 강제
sys.stdout.reconfigure(encoding="utf-8")
REAL_STDOUT = sys.stdout
sys.stdout = sys.stderr

FOSSLIGHT_LOGGER = "FOSSLight"

# manifest 파일 → 필요한 패키지 매니저 실행 파일
MANIFEST_TOOLS = {
    "package.json": "npm",
    "pom.xml": "mvn",
    "build.gradle": "gradle",
    "build.gradle.kts": "gradle",
    "requirements.txt": "python",
    "setup.py": "python",
    "Pipfile": "python",
    "go.mod": "go",
    "Cargo.toml": "cargo",
    "Gemfile": "gem",
    "pubspec.yaml": "flutter",
}


def emit(obj):
    REAL_STDOUT.write(json.dumps(obj, ensure_ascii=False) + "\n")
    REAL_STDOUT.flush()


class NdjsonLogHandler(logging.Handler):
    """fosslight 로거 출력을 Electron으로 전달"""

    def __init__(self):
        super().__init__()
        # fosslight는 URL 다운로드 실패 시에도 run_main이 True를 반환하고
        # 빈 스캔을 계속하므로, 로그로 실패를 감지해야 함
        self.download_failed = False

    # fosslight가 스캔 성공 후 임시 폴더 정리 실패를 WARNING으로 남기는데,
    # 정리는 래퍼(salvage_temp_reports)가 대신 수행하므로 사용자에게는 잡음임
    _CLEANUP_NOISE_MARKERS = ("temp_extract_", ".fosslight_temp_", "fosslight_raw_data", "venv_osc_dep_tmp")

    def emit(self, record):
        try:
            message = record.getMessage()
            if "Download failed" in message:
                self.download_failed = True
            if "WinError 32" in message and any(m in message for m in self._CLEANUP_NOISE_MARKERS):
                emit({"type": "log", "level": "INFO",
                      "message": "fosslight의 임시 파일 정리가 지연되어 앱이 대신 정리합니다."})
                return
            emit({"type": "log", "level": record.levelname, "message": message})
        except Exception:
            pass


def _rmtree_force(path, retries=5):
    """읽기 전용 파일(git clone의 .git 등)도 지우는 rmtree.
    일시적 파일 잠금(WinError 32)은 잠시 대기 후 재시도한다."""
    def _onerror(func, p, _exc):
        try:
            os.chmod(p, stat.S_IWRITE)
            func(p)
        except Exception:
            pass
    for _ in range(retries):
        shutil.rmtree(path, onerror=_onerror)
        if not os.path.exists(path):
            return
        time.sleep(2)


def salvage_temp_reports(output_dir, started_at):
    """Windows에서 fosslight의 임시 폴더 정리(shutil.rmtree)가 읽기 전용 파일
    (git clone의 .git, 의존성 분석용 venv 등) 때문에 실패하면 최종 리포트가
    .fosslight_temp_* 안에 남고 temp_extract_*(압축 해제본)도 잔류한다.
    리포트를 회수하고 임시 폴더들을 강제 제거한다."""
    # fosslight_dependency가 분석 대상 폴더로 chdir한 채 복귀하지 않으므로
    # 자기 자신의 cwd가 삭제 대상 폴더를 잠그지 않도록 출력 폴더로 복귀
    os.chdir(output_dir)
    parent = os.path.dirname(os.path.abspath(output_dir))
    for temp_dir in glob.glob(os.path.join(parent, ".fosslight_temp_*")):
        if os.path.getmtime(temp_dir) < started_at:
            continue  # 이번 스캔에서 만든 폴더가 아님
        for report in glob.glob(os.path.join(temp_dir, "fosslight_report_*")):
            dst = os.path.join(output_dir, os.path.basename(report))
            if not os.path.exists(dst):
                shutil.move(report, dst)
        _rmtree_force(temp_dir)
    # 압축파일 분석 시 cwd(=출력 폴더)에 생성되는 압축 해제 폴더 잔여물 정리
    for extract_dir in glob.glob(os.path.join(output_dir, "temp_extract_*")):
        if os.path.getmtime(extract_dir) >= started_at:
            _rmtree_force(extract_dir)


def check_git_available(url):
    """git 저장소 URL 분석은 시스템 git이 필요 — 없으면 경고 이벤트 발생"""
    from fosslight_util.download import compression_extension

    is_archive_url = any(url.lower().split("?")[0].endswith(ext) for ext in compression_extension)
    if not is_archive_url and shutil.which("git") is None:
        emit({
            "type": "log",
            "level": "WARNING",
            "message": "git이 설치되어 있지 않아 git 저장소 URL 분석이 실패할 수 있습니다. "
                       "(압축파일 다운로드 URL은 git 없이 동작합니다)",
        })


def check_package_managers(target_path, mode_list):
    """dependency 분석 대상의 패키지 매니저 존재 여부 확인 후 경고 이벤트 발생"""
    if not any(m in ("all", "dependency") for m in mode_list):
        return
    if not os.path.isdir(target_path):  # 압축파일/URL 대상은 사전 점검 생략
        return
    try:
        entries = set(os.listdir(target_path))
    except OSError:
        return
    for manifest, tool in MANIFEST_TOOLS.items():
        if manifest in entries and shutil.which(tool) is None:
            emit({
                "type": "log",
                "level": "WARNING",
                "message": f"'{manifest}'이(가) 감지되었지만 '{tool}'이(가) 설치되어 있지 않아 "
                           f"해당 의존성 분석이 실패할 수 있습니다.",
            })


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--path")  # 폴더 또는 압축파일 (압축은 run_main이 자동 해제)
    group.add_argument("--url")   # git clone / 다운로드 가능한 URL
    parser.add_argument("--modes", required=True)  # "all" 또는 "source,dependency" 형식
    parser.add_argument("--exclude", default="")   # ; 구분
    parser.add_argument("--output", required=True)
    parser.add_argument("--debug-source", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()

    if args.debug_source:
        # 동결 환경 진단용: source 스캐너를 직접 호출해 전체 traceback 확보
        # (fosslight_scanner는 source 분석 예외를 메시지만 남기고 삼키므로
        #  PyInstaller 번들 누락 모듈을 찾을 때 이 플래그로 확인한다)
        try:
            from fosslight_source.cli import run_scanners
            os.makedirs(args.output, exist_ok=True)
            os.chdir(args.output)
            result = run_scanners(args.path, os.path.join(args.output, "dbg.xlsx"))
            emit({"type": "log", "level": "DEBUG", "message": f"run_scanners OK: {type(result)}"})
        except Exception:
            emit({"type": "error", "message": "debug-source", "traceback": traceback.format_exc()})
        sys.exit(0)

    mode_list = ["all"] if args.modes == "all" else args.modes.split(",")
    exclude_list = [e for e in args.exclude.split(";") if e]

    os.makedirs(args.output, exist_ok=True)
    # fosslight가 .fosslight_temp_* 를 cwd에 생성하므로 쓰기 가능한 위치로 이동
    # (패키징된 앱의 리소스 폴더는 Program Files라 쓰기 불가)
    os.chdir(args.output)

    # 핸들러를 먼저 달면 fosslight의 init_log가 로거 설정을 건너뛰므로
    # (hasHandlers 분기) 레벨을 직접 INFO로 지정해야 진행 로그가 전달됨
    logger = logging.getLogger(FOSSLIGHT_LOGGER)
    logger.setLevel(logging.INFO)
    ndjson_handler = NdjsonLogHandler()
    logger.addHandler(ndjson_handler)

    analyze_target = args.path or args.url

    try:
        emit({"type": "phase", "phase": "starting", "modes": mode_list})
        if args.url:
            check_git_available(args.url)
        else:
            check_package_managers(args.path, mode_list)

        from fosslight_scanner.fosslight_scanner import run_main

        emit({"type": "phase", "phase": "scanning"})
        scan_started_at = time.time()
        # file_format 첫 항목은 반드시 excel이어야 함 (RECON.md 참고)
        # 압축파일 경로와 URL 다운로드는 run_main이 자체 처리한다
        ok = run_main(
            mode_list,
            [args.path or ""],
            [],
            args.output,
            ["excel", "yaml"],
            args.url or "",
            "",
            hide_progressbar=True,
            path_to_exclude=exclude_list,
        )
        emit({"type": "phase", "phase": "normalizing"})
        salvage_temp_reports(args.output, scan_started_at)

        if ndjson_handler.download_failed:
            raise RuntimeError("다운로드에 실패했습니다. URL을 확인해주세요.")
        # run_main은 스캔 성공 후 임시 파일 정리 예외에도 False를 반환하므로
        # 리포트 존재 여부로 실제 성패를 판정한다
        reports_exist = any(
            os.path.getmtime(f) >= scan_started_at
            for f in glob.glob(os.path.join(args.output, "fosslight_report_*.xlsx"))
        )
        if ok is False and not reports_exist:
            raise RuntimeError("스캔이 실패했습니다. 분석 대상 경로/URL을 확인해주세요.")

        from normalize_report import normalize_report

        result_path = normalize_report(args.output, analyze_target, mode_list)
        emit({"type": "result", "resultFile": result_path})
        sys.exit(0)
    except SystemExit:
        raise
    except Exception as ex:
        emit({"type": "error", "message": str(ex), "traceback": traceback.format_exc()})
        sys.exit(1)


if __name__ == "__main__":
    multiprocessing.freeze_support()  # 필수: scancode가 multiprocessing 사용
    main()
