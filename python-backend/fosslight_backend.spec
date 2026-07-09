# -*- mode: python ; coding: utf-8 -*-
# FOSSLight GUI 백엔드 PyInstaller spec (onedir)
# scancode-toolkit은 대용량 데이터 + entry point 플러그인 탐색을 사용하므로
# collect_all과 copy_metadata가 모두 필요하다 (RECON.md 참고)
from PyInstaller.utils.hooks import collect_all, copy_metadata

datas, binaries, hiddenimports = [], [], []


def _norm_path(path):
    return (path or "").replace("\\", "/").lower()


def _dedupe(seq):
    seen = set()
    result = []
    for item in seq:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _is_excluded_data(data_tuple):
    src, dst = data_tuple
    src_path = _norm_path(src)
    dst_path = _norm_path(dst)

    # 설치 용량을 크게 차지하는 사전 생성 라이선스 인덱스는 번들에서 제외하고
    # 런타임에 사용자 캐시로 1회 생성한다.
    if "licensedcode/data/cache/license_index/index_cache" in src_path:
        return True
    if "licensedcode/data/cache/license_index/index_cache" in dst_path:
        return True

    noisy_markers = (
        "/tests/",
        "/test/",
        "/testing/",
        "/__pycache__/",
    )
    if any(marker in src_path for marker in noisy_markers):
        return True

    return src_path.endswith((".pyc", ".pyo"))


def _is_excluded_hiddenimport(module_name):
    lowered = (module_name or "").lower()
    return ".tests" in lowered or lowered.endswith(".test")

# 대용량 데이터 트리 / 동적 임포트를 쓰는 패키지 전체 수집
COLLECT_PACKAGES = [
    "fosslight_scanner",
    "fosslight_util",
    "fosslight_source",
    "fosslight_dependency",
    "fosslight_binary",
    "scancode",
    "licensedcode",
    "commoncode",
    "typecode",
    "extractcode",
    "plugincode",
    "textcode",
    "cluecode",
    "packagedcode",
    "summarycode",
    "formattedcode",
    "scancode_config",
    "magic",  # python-magic-bin (libmagic dll + mgc)
    "numpy",  # pandas 의존 - lazy import 서브모듈 누락 방지
    "rfc3987_syntax",  # jsonschema 의존 - .lark 문법 데이터 파일
    "lark",  # rfc3987_syntax 의존 - 문법 데이터 파일
    # scancode location-provider 플러그인 (entry point로 로드되므로 모듈 본체 필수)
    "typecode_libmagic",
    "extractcode_7z",
    "extractcode_libarchive",
    # scancode 생태계의 C 확장/데이터 패키지 (entry point 경유라 정적 분석에 안 잡힘)
    "intbitset",
    "publicsuffix2",
    "tlsh",
    "dukpy",
    "pygmars",
    "saneyaml",
    "urlpy",
    "cyseq",
    "multiregex",
    "binaryornot",
    "fingerprints",
    "normality",
    "debian_inspector",
    "gemfileparser2",
    "packageurl",
    "container_inspector",
    "pdfminer",
]
for pkg in COLLECT_PACKAGES:
    try:
        d, b, h = collect_all(pkg)
        datas += d
        binaries += b
        hiddenimports += h
    except Exception:
        pass

# scancode는 importlib.metadata entry point로 플러그인을 탐색하므로
# dist 메타데이터가 없으면 스캐너를 찾지 못하고 조용히 실패한다
METADATA_DISTS = [
    "scancode-toolkit",
    "typecode",
    "extractcode",
    "commoncode",
    "plugincode",
    "typecode-libmagic",
    "extractcode-7z",
    "extractcode-libarchive",
    "fosslight_scanner",
    "fosslight_source",
    "fosslight_dependency",
    "fosslight_binary",
    "fosslight_util",
]
for dist in METADATA_DISTS:
    try:
        datas += copy_metadata(dist)
    except Exception:
        pass

datas = [d for d in _dedupe(datas) if not _is_excluded_data(d)]
binaries = _dedupe(binaries)
hiddenimports = [h for h in _dedupe(hiddenimports) if not _is_excluded_hiddenimport(h)]

a = Analysis(
    ["src\\backend_main.py"],
    pathex=["src"],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports
    + ["pkg_resources", "normalize_report", "intbitset_helper", "intbitset_version", "ahocorasick"],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="fosslight-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,  # stdout NDJSON 채널 필요 (Electron이 windowsHide로 스폰)
    disable_windowed_traceback=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="fosslight-backend",
)
