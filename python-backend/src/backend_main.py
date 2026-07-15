# FOSSLight Scanner GUI 백엔드 래퍼
# Electron이 spawn하여 실행. stdout으로 NDJSON 이벤트를 내보내고,
# 스캔 완료 후 정규화된 gui_result.json을 출력 디렉토리에 기록한다.
import argparse
import difflib
import glob
import ipaddress
import json
import logging
import multiprocessing
import os
import re
import shutil
import stat
import sys
import threading
import time
import traceback
import urllib.parse

# git 미설치 PC에서 GitPython이 import 시점에 "Bad git executable"로 죽는 것을 방지.
# quiet로 두면 실제 git 사용 시점(git URL 분석)에만 오류가 나므로,
# git이 필요 없는 폴더/압축파일 분석은 정상 동작한다. (fosslight 임포트 전에 설정 필수)
os.environ.setdefault("GIT_PYTHON_REFRESH", "quiet")

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


def configure_scancode_cache_env():
    """ScanCode 캐시를 설치 경로가 아닌 사용자 쓰기 가능한 경로로 고정한다.
    번들에 사전 생성된 license_index를 포함하지 않을 때도 첫 실행에서 캐시를
    생성할 수 있어야 하므로, 환경변수를 여기서 명시적으로 설정한다."""
    scancode_cache = os.environ.get("SCANCODE_CACHE")
    if not scancode_cache:
        base = os.environ.get("LOCALAPPDATA")
        if not base:
            base = os.path.join(os.path.expanduser("~"), ".cache")
        scancode_cache = os.path.join(base, "FOSSLightScanner", "scancode")
        os.environ["SCANCODE_CACHE"] = scancode_cache

    licensedcode_cache = os.environ.get("SCANCODE_LICENSE_INDEX_CACHE")
    if not licensedcode_cache:
        licensedcode_cache = os.path.join(scancode_cache, "licensedcode")
        os.environ["SCANCODE_LICENSE_INDEX_CACHE"] = licensedcode_cache

    packagedcode_cache = os.environ.get("SCANCODE_PACKAGE_INDEX_CACHE")
    if not packagedcode_cache:
        packagedcode_cache = os.path.join(scancode_cache, "packagedcode")
        os.environ["SCANCODE_PACKAGE_INDEX_CACHE"] = packagedcode_cache

    for path in (scancode_cache, licensedcode_cache, packagedcode_cache):
        os.makedirs(path, exist_ok=True)


def warmup_license_index_cache():
    """라이선스 인덱스 캐시가 없으면 최초 1회 생성한다."""
    licensedcode_cache = os.environ.get("SCANCODE_LICENSE_INDEX_CACHE", "")
    cache_file = os.path.join(licensedcode_cache, "license_index", "index_cache")
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 0:
        return

    emit({
        "type": "log",
        "level": "INFO",
        "message": "초기 실행 준비: 라이선스 인덱스 캐시를 생성합니다. (1회)"
    })
    started = time.time()

    try:
        from licensedcode.cache import get_cache

        get_cache()
    except Exception as ex:
        raise RuntimeError("라이선스 인덱스 캐시 생성에 실패했습니다.") from ex

    elapsed = int(time.time() - started)
    emit({
        "type": "log",
        "level": "INFO",
        "message": f"라이선스 인덱스 캐시 생성 완료 ({elapsed}초)"
    })


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
    
    # SSRF 위험 검증 (메인 스캔 경로)
    if not is_archive_url:
        hostname = _extract_hostname_from_git_url(url)
        is_risky, risk_reason = _is_ssrf_risk_host(hostname)
        if is_risky:
            emit({
                "type": "log",
                "level": "WARNING",
                "message": f"보안 경고: Git URL의 호스트가 내부 네트워크 주소({risk_reason})입니다. "
                           "신뢰할 수 있는 URL인지 확인해주세요.",
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


def available_memory_gb():
    """Windows 가용 물리 메모리(GB). 확인 실패 시 None."""
    try:
        import ctypes

        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        status = MEMORYSTATUSEX()
        status.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return None
        return status.ullAvailPhys / (1024 ** 3)
    except Exception:
        return None


def safe_num_cores():
    """scancode 병렬 워커 수를 가용 메모리에 맞춰 제한한다.
    Windows는 spawn 방식이라 워커마다 라이선스 인덱스(약 1.5GB)를 각자
    로드하므로, 기본값(CPU-1)을 그대로 쓰면 저사양 PC에서 스와핑으로
    분석이 멈춘 것처럼 보이는 현상이 발생한다."""
    max_by_cpu = max(1, multiprocessing.cpu_count() - 1)
    avail_gb = available_memory_gb()
    if avail_gb is None:
        cores = min(max_by_cpu, 4)  # 메모리 확인 불가 시 보수적으로
        detail = f"CPU {multiprocessing.cpu_count()}코어"
    else:
        cores = max(1, min(max_by_cpu, int(avail_gb // 1.5)))
        detail = f"CPU {multiprocessing.cpu_count()}코어, 가용 메모리 {avail_gb:.1f}GB"
    emit({
        "type": "log",
        "level": "INFO",
        "message": f"병렬 분석 프로세스: {cores}개 ({detail})",
    })
    return cores


def start_heartbeat(interval_sec=60):
    """장시간 분석(scancode는 완료까지 로그가 없음) 중 진행 상태를 주기적으로
    알려 멈춘 것으로 오인하지 않게 한다. 반환된 Event를 set하면 중단."""
    stop = threading.Event()
    started = time.time()

    def beat():
        while not stop.wait(interval_sec):
            elapsed_min = int((time.time() - started) // 60)
            emit({
                "type": "log",
                "level": "INFO",
                "message": f"스캔 진행 중... (경과 {elapsed_min}분)",
            })

    threading.Thread(target=beat, daemon=True).start()
    return stop


def check_long_paths_enabled(mode_list):
    """Windows 긴 경로(260자 제한 해제) 미지원 시 pypi 의존성 분석이
    실패할 수 있어 경고 이벤트 발생 (예: scancode의 긴 라이선스 룰 파일명)"""
    if not any(m in ("all", "dependency") for m in mode_list):
        return
    if sys.platform != "win32":
        return
    try:
        import winreg

        with winreg.OpenKey(
            winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\FileSystem"
        ) as key:
            value, _ = winreg.QueryValueEx(key, "LongPathsEnabled")
    except OSError:
        value = 0
    if not value:
        emit({
            "type": "log",
            "level": "WARNING",
            "message": "Windows 긴 경로 지원이 꺼져 있어 일부 Python 프로젝트의 "
                       "의존성 분석이 실패할 수 있습니다.",
        })


def _emit_versions():
    """--versions 플래그 처리: FOSSLight 패키지 버전을 JSON으로 출력 후 종료"""
    import importlib.metadata

    packages = [
        ("fosslight_scanner", ["fosslight_scanner", "fosslight-scanner"]),
        (
            "fosslight_source",
            ["fosslight_source", "fosslight-source-scanner", "fosslight_source_scanner"],
        ),
        (
            "fosslight_dependency",
            [
                "fosslight_dependency",
                "fosslight-dependency-scanner",
                "fosslight_dependency_scanner",
            ],
        ),
        (
            "fosslight_binary",
            ["fosslight_binary", "fosslight-binary-scanner", "fosslight_binary_scanner"],
        ),
    ]
    versions = {}
    for key, dist_names in packages:
        ver = None
        for dist in dist_names:
            try:
                ver = importlib.metadata.version(dist)
                break
            except importlib.metadata.PackageNotFoundError:
                continue
        versions[key] = ver
    emit({"type": "versions", "versions": versions})


def _looks_like_git_repo_url(url):
    from fosslight_util.download import compression_extension

    if not url:
        return False
    lowered = url.lower().split("?")[0]
    if any(lowered.endswith(ext) for ext in compression_extension):
        return False
    return url.startswith(("http://", "https://", "git@", "git://", "ssh://"))


def _extract_hostname_from_git_url(git_url):
    """Git URL에서 hostname을 추출합니다.
    지원 형식: https://..., http://..., git://, ssh://, git@...
    """
    git_url = (git_url or "").strip()
    
    # ssh:// 형식: ssh://git@github.com/...
    if git_url.startswith("ssh://"):
        parsed = urllib.parse.urlparse(git_url)
        return parsed.hostname
    
    # https://, http://, git:// 형식
    if git_url.startswith(("https://", "http://", "git://")):
        parsed = urllib.parse.urlparse(git_url)
        return parsed.hostname
    
    # git@github.com:user/repo.git 형식
    if git_url.startswith("git@"):
        # git@github.com:... → github.com 추출
        host_part = git_url[4:].split(":")[0].split("/")[0]
        return host_part if host_part else None
    
    return None


def _is_ssrf_risk_host(hostname):
    """호스트가 SSRF 위험 대상인지 검증합니다.
    사설 IP, loopback, link-local, localhost 등을 감지합니다.
    
    Returns: (is_risky, reason) - (bool, str or None)
    """
    if not hostname:
        return False, None
    
    hostname_lower = hostname.lower()
    
    # localhost 도메인명 체크
    if hostname_lower in ("localhost", "localhost.localdomain"):
        return True, "localhost"
    
    try:
        # IP 주소인지 확인하고 위험 범위 체크
        ip = ipaddress.ip_address(hostname)
        
        if ip.is_loopback:
            return True, "loopback address"
        if ip.is_private:
            return True, "private network"
        if ip.is_link_local:
            return True, "link-local address"
        if ip.is_multicast:
            return True, "multicast address"
        if ip.is_reserved:
            return True, "reserved address"
    except ValueError:
        # 정규 도메인명인 경우 - 추가 검증 불필요 (DNS를 통한 공격은 제어 불가)
        pass
    
    return False, None


_SEMVER_LIKE = re.compile(r"^\d+(?:\.\d+){1,3}(?:[-+._A-Za-z0-9]*)?$", re.IGNORECASE)


def _canonical_ref_name(ref_name):
    value = (ref_name or "").strip()
    for prefix in ("refs/tags/", "refs/remotes/origin/", "refs/heads/"):
        if value.startswith(prefix):
            return value[len(prefix):]
    return value


def _strip_v_prefix(value):
    return re.sub(r"^v\.?\s*", "", value.strip(), flags=re.IGNORECASE)


def _is_user_ref_equivalent(user_input_ref, candidate_ref):
    user_ref = _canonical_ref_name(user_input_ref)
    remote_ref = _canonical_ref_name(candidate_ref)
    if not user_ref or not remote_ref:
        return False
    if user_ref.lower() == remote_ref.lower():
        return True

    # semver 태그는 v 접두어 유무를 동일하게 취급 (예: 2.1.0 == v2.1.0)
    user_no_v = _strip_v_prefix(user_ref)
    remote_no_v = _strip_v_prefix(remote_ref)
    if user_no_v.lower() != remote_no_v.lower():
        return False
    return bool(_SEMVER_LIKE.match(user_no_v) and _SEMVER_LIKE.match(remote_no_v))


def _emit_git_ref_validation(url, ref):
    from fosslight_util.download import get_ref_to_checkout, get_remote_refs

    ref = (ref or "").strip()
    if not ref:
        emit(
            {
                "type": "gitRefValidation",
                "valid": False,
                "isGitUrl": True,
                "refType": None,
                "resolvedRef": None,
                "message": "브랜치/태그 값을 입력해주세요.",
            }
        )
        return

    if not _looks_like_git_repo_url(url):
        emit(
            {
                "type": "gitRefValidation",
                "valid": False,
                "isGitUrl": False,
                "refType": None,
                "resolvedRef": None,
                "message": "압축파일 URL이거나 git 저장소 URL 형식이 아닙니다.",
            }
        )
        return

    if shutil.which("git") is None:
        emit(
            {
                "type": "gitRefValidation",
                "valid": False,
                "isGitUrl": True,
                "refType": None,
                "resolvedRef": None,
                "message": "git이 설치되어 있지 않아 브랜치/태그를 검증할 수 없습니다.",
            }
        )
        return

    # SSRF 위험 검증
    hostname = _extract_hostname_from_git_url(url)
    is_risky, risk_reason = _is_ssrf_risk_host(hostname)
    if is_risky:
        emit({
            "type": "log",
            "level": "WARNING",
            "message": f"보안 경고: Git URL의 호스트가 내부 네트워크 주소({risk_reason})입니다. "
                       "신뢰할 수 있는 URL인지 확인해주세요.",
        })

    refs = get_remote_refs(url)
    tag_set = set(refs.get("tags", []))
    branch_set = set(refs.get("branches", []))
    all_refs = sorted(tag_set | branch_set)
    full_ref_list = []
    for branch in sorted(branch_set):
        full_ref_list.append(branch)
        full_ref_list.append(f"refs/remotes/origin/{branch}")
    for tag in sorted(tag_set):
        full_ref_list.append(tag)
        full_ref_list.append(f"refs/tags/{tag}")
    full_ref_set = set(full_ref_list)

    resolved_full_ref = get_ref_to_checkout(ref, full_ref_list)
    if resolved_full_ref not in full_ref_set:
        resolved_full_ref = ""

    resolved_ref = None
    ref_type = None
    if resolved_full_ref:
        if resolved_full_ref.startswith("refs/tags/"):
            candidate = resolved_full_ref[len("refs/tags/"):]
            if candidate in tag_set and _is_user_ref_equivalent(ref, candidate):
                resolved_ref = candidate
                ref_type = "tag"
        elif resolved_full_ref.startswith("refs/remotes/origin/"):
            candidate = resolved_full_ref[len("refs/remotes/origin/"):]
            if candidate in branch_set and _is_user_ref_equivalent(ref, candidate):
                resolved_ref = candidate
                ref_type = "branch"
        elif resolved_full_ref in tag_set:
            if _is_user_ref_equivalent(ref, resolved_full_ref):
                resolved_ref = resolved_full_ref
                ref_type = "tag"
        elif resolved_full_ref in branch_set:
            if _is_user_ref_equivalent(ref, resolved_full_ref):
                resolved_ref = resolved_full_ref
                ref_type = "branch"

    if resolved_ref:
        emit(
            {
                "type": "gitRefValidation",
                "valid": True,
                "isGitUrl": True,
                "refType": ref_type,
                "resolvedRef": resolved_ref,
                "message": "유효한 브랜치/태그입니다.",
                "suggestions": [],
            }
        )
        return

    similar = difflib.get_close_matches(ref, all_refs, n=5, cutoff=0.5)
    if not similar:
        lower_ref = ref.lower()
        similar = [
            candidate
            for candidate in all_refs
            if lower_ref in candidate.lower() or candidate.lower().startswith(lower_ref)
        ][:5]

    warn_msg = "원격 저장소에서 해당 브랜치/태그를 찾지 못했습니다."
    if similar:
        warn_msg += " 유사한 Branch/Tag를 확인해 주세요."

    emit(
        {
            "type": "gitRefValidation",
            "valid": False,
            "isGitUrl": True,
            "refType": None,
            "resolvedRef": None,
            "message": warn_msg,
            "suggestions": similar,
        }
    )


def main():
    if "--versions" in sys.argv:
        _emit_versions()
        return

    if "--validate-git-ref" in sys.argv:
        parser = argparse.ArgumentParser()
        parser.add_argument("--validate-git-ref", action="store_true", help=argparse.SUPPRESS)
        parser.add_argument("--url", required=True)
        parser.add_argument("--ref", required=True)
        args = parser.parse_args()
        _emit_git_ref_validation(args.url, args.ref)
        return

    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--path")  # 폴더 또는 압축파일 (압축은 run_main이 자동 해제)
    group.add_argument("--url")   # git clone / 다운로드 가능한 URL
    parser.add_argument("--modes", required=True)  # "all" 또는 "source,dependency" 형식
    parser.add_argument("--exclude", default="")   # ; 구분
    parser.add_argument("--output", required=True)
    parser.add_argument("--result-file", default=None)  # gui_result.json 저장 경로 (기본: --output 폴더)
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

    configure_scancode_cache_env()

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
        warmup_license_index_cache()
        if args.url:
            check_git_available(args.url)
        else:
            check_package_managers(args.path, mode_list)
        check_long_paths_enabled(mode_list)

        from fosslight_scanner.fosslight_scanner import run_main

        emit({"type": "phase", "phase": "scanning"})
        scan_started_at = time.time()
        num_cores = safe_num_cores()
        heartbeat_stop = start_heartbeat()
        # file_format 첫 항목은 반드시 excel이어야 함 (RECON.md 참고)
        # 압축파일 경로와 URL 다운로드는 run_main이 자체 처리한다
        try:
            ok = run_main(
                mode_list,
                [args.path or ""],
                [],
                args.output,
                ["excel"],
                args.url or "",
                "",
                hide_progressbar=True,
                num_cores=num_cores,
                path_to_exclude=exclude_list,
            )
        finally:
            heartbeat_stop.set()
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

        result_file, report = normalize_report(args.output, analyze_target, mode_list, result_file=args.result_file)
        emit({"type": "result", "resultFile": result_file, "report": report})
        sys.exit(0)
    except SystemExit:
        raise
    except Exception as ex:
        emit({"type": "error", "message": str(ex), "traceback": traceback.format_exc()})
        sys.exit(1)


if __name__ == "__main__":
    multiprocessing.freeze_support()  # 필수: scancode가 multiprocessing 사용
    main()
