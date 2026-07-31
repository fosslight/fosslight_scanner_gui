#!/usr/bin/env python
"""패키지 매니저 회귀 검사 — 상류(fosslight-*)를 올린 뒤 배포 전에 돌린다.

fosslight_dependency_scanner의 테스트 픽스처를 앱 백엔드로 분석해 매니저별 검출 건수를
scripts/regression-baseline.json의 기준선과 비교한다. 상류 업데이트가 결과를 바꿨는지
배포 전에 드러내는 것이 목적이다(실제로 상류 변경으로 gradle 분석이 통째로 죽은 적이 있고,
그때는 사용자 신고로 알았다).

실행:
  python-backend\\pybuild\\python\\python.exe scripts\\run-regression.py
  ... --only gradle2,pypi      일부만
  ... --clean-gradle           Gradle 캐시를 비우고 실행(빌드 스크립트 재컴파일까지 확인)
  ... --update                 결과를 새 기준선으로 저장(의도된 변화일 때만)

Java: gradle/maven 픽스처는 Gradle이 요구하는 Java 버전이 달라 픽스처마다 지정한다.
경로는 FL_TEST_JRE11 / FL_TEST_JDK17 환경변수로 주거나, 없으면 아래 기본 위치에서 찾는다.
찾지 못하면 해당 픽스처는 FAIL이 아니라 SKIP으로 처리한다.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = os.path.join(ROOT, "scripts", "regression-baseline.json")
BACKEND = os.path.join(ROOT, "python-backend", "pybuild")
DEFAULT_TESTS = r"D:\fosslight_dependency_scanner\tests"
# 픽스처마다 새로 만들지 않고 재사용한다(배포판 재다운로드가 매번 일어나면 너무 느리다).
# 사용자 기본 캐시(~/.gradle)와 분리해 결과를 재현 가능하게 유지한다.
GRADLE_HOME = os.path.join(os.environ.get("LOCALAPPDATA", ""), "fl-regression", "gradle")


def find_java(kind):
    """kind('jre11'|'jdk17')에 해당하는 JAVA_HOME. 없으면 None."""
    env = os.environ.get("FL_TEST_JRE11" if kind == "jre11" else "FL_TEST_JDK17")
    if env and os.path.isfile(os.path.join(env, "bin", "java.exe")):
        return env
    base = os.path.join(os.environ.get("LOCALAPPDATA", ""), "fl-verify", kind)
    try:
        for name in os.listdir(base):
            cand = os.path.join(base, name)
            if os.path.isfile(os.path.join(cand, "bin", "java.exe")):
                return cand
    except OSError:
        pass
    return None


def tool_exists(tool):
    return shutil.which(tool) is not None


def clean_artifacts(project_dir, names):
    """분석이 남긴 산출물을 지운다. 남아 있으면 다음 실행이 이를 재사용하거나 실패한다."""
    for rel in names or []:
        target = os.path.join(project_dir, rel)
        if os.path.isdir(target):
            shutil.rmtree(target, ignore_errors=True)
        elif os.path.isfile(target):
            try:
                os.remove(target)
            except OSError:
                pass


def run_fixture(fx, tests_dir, out_root):
    """한 픽스처를 분석하고 (상태, 건수, 비고)를 돌려준다."""
    project = os.path.join(tests_dir, fx["path"].replace("/", os.sep))
    if not os.path.isdir(project):
        return "SKIP", None, "픽스처 경로 없음"

    for tool in fx.get("requires", []):
        if not tool_exists(tool):
            return "SKIP", None, f"'{tool}' 미설치"

    env = dict(os.environ)
    java_kind = fx.get("java")
    if java_kind:
        home = find_java(java_kind)
        if not home:
            return "SKIP", None, f"{java_kind} 없음 (FL_TEST_{java_kind.upper()} 로 지정)"
        env["JAVA_HOME"] = home
        env["PATH"] = os.path.join(home, "bin") + os.pathsep + env.get("PATH", "")
        env["GRADLE_USER_HOME"] = GRADLE_HOME

    clean_artifacts(project, fx.get("pre_clean"))

    out_dir = os.path.join(out_root, fx["name"])
    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir, exist_ok=True)

    cmd = [
        os.path.join(BACKEND, "python", "python.exe"),
        os.path.join(BACKEND, "backend_main.py"),
        "--path", project, "--modes", "dependency", "--output", out_dir,
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                              errors="replace", timeout=2400, env=env)
    except subprocess.TimeoutExpired:
        return "FAIL", None, "시간 초과(40분)"

    result_path = os.path.join(out_dir, "gui_result.json")
    if not os.path.isfile(result_path):
        tail = (proc.stdout or "").strip().splitlines()[-1:] or ["(출력 없음)"]
        return "FAIL", None, f"결과 파일 없음 — {tail[0][:110]}"
    try:
        with open(result_path, encoding="utf-8") as f:
            count = len(json.load(f)["items"]["dependency"])
    except Exception as ex:  # noqa: BLE001
        return "FAIL", None, f"결과 파싱 실패: {ex}"
    return "OK", count, ""


def main():
    ap = argparse.ArgumentParser(description="패키지 매니저 회귀 검사")
    ap.add_argument("--tests-dir", default=os.environ.get("FL_TESTS_DIR", DEFAULT_TESTS))
    ap.add_argument("--only", help="쉼표로 구분한 픽스처 이름")
    ap.add_argument("--clean-gradle", action="store_true", help="Gradle 캐시를 비우고 실행")
    ap.add_argument("--update", action="store_true", help="결과를 새 기준선으로 저장")
    args = ap.parse_args()

    with open(BASELINE, encoding="utf-8") as f:
        baseline = json.load(f)
    fixtures = baseline["fixtures"]
    if args.only:
        wanted = {n.strip() for n in args.only.split(",")}
        fixtures = [fx for fx in fixtures if fx["name"] in wanted]
        missing = wanted - {fx["name"] for fx in fixtures}
        if missing:
            print(f"알 수 없는 픽스처: {', '.join(sorted(missing))}", file=sys.stderr)
            return 2

    if args.clean_gradle:
        # 캐시가 있으면 빌드 스크립트 재컴파일이 생략돼 Java 호환성 문제가 가려진다.
        print(f"Gradle 캐시 삭제: {GRADLE_HOME}")
        shutil.rmtree(GRADLE_HOME, ignore_errors=True)

    out_root = os.path.join(os.environ.get("LOCALAPPDATA", ""), "fl-regression", "out")
    os.makedirs(out_root, exist_ok=True)

    print(f"픽스처 {len(fixtures)}개 | 대상: {args.tests_dir}\n")
    print(f"{'픽스처':<20}{'상태':<7}{'건수':>7}{'기준':>7}  비고")
    print("-" * 78)

    rows, failed, total = [], 0, 0
    for fx in fixtures:
        started = time.time()
        status, count, note = run_fixture(fx, args.tests_dir, out_root)
        elapsed = int(time.time() - started)
        expected = fx["expected"]

        if status == "OK":
            total += count
            if count != expected:
                status = "DIFF"
                note = f"기준선과 다름 ({count - expected:+d})"
                failed += 1
            elif fx.get("expect_zero"):
                note = fx["expect_zero"]
        elif status == "FAIL":
            failed += 1

        shown = "-" if count is None else str(count)
        print(f"{fx['name']:<20}{status:<7}{shown:>7}{expected:>7}  {note} ({elapsed}s)")
        rows.append((fx, status, count))

    print("-" * 78)
    print(f"합계 {total}건 (기준선 {baseline['baselineTotal']})")

    if args.update:
        for fx, status, count in rows:
            if status in ("OK", "DIFF") and count is not None:
                fx["expected"] = count
        baseline["baselineTotal"] = total
        with open(BASELINE, "w", encoding="utf-8") as f:
            json.dump(baseline, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"기준선을 갱신했습니다: {BASELINE}")
        return 0

    if failed:
        print(f"\n{failed}건이 기준선과 다르거나 실패했습니다. "
              "상류 변경이 결과에 영향을 줬는지 확인하세요.")
        return 1
    print("\n모두 기준선과 일치합니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
