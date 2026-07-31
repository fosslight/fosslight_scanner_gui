# fosslight xlsx 리포트를 GUI용 gui_result.json으로 정규화
# 시트/컬럼 구조는 RECON.md 참고 (fosslight-scanner v2.1.25 실측 기준)
import glob
import json
import os
from datetime import datetime

from openpyxl import load_workbook

# 시트명 → gui_result.json의 스캐너 키
SHEET_TO_SCANNER = {
    "SRC_FL_Source": "source",
    "BIN_FL_Binary": "binary",
    "DEP_FL_Dependency": "dependency",
}

# xlsx 컬럼명 → OssItem 필드
COLUMN_MAP = {
    "OSS Name": "name",
    "OSS Version": "version",
    "License": "license",
    "Download Location": "downloadLocation",
    "Homepage": "homepage",
    "Copyright Text": "copyright",
    "Exclude": "exclude",
    "Comment": "comment",
}
PATH_COLUMNS = ("Source Path", "Binary Path", "Package URL")


def _parse_sheet(ws):
    """(항목들, 없어진 컬럼명들)을 돌려준다.
    없어진 컬럼을 함께 보고하는 이유: 예전에는 모르는 컬럼을 그냥 건너뛰어서,
    상류가 스키마를 바꾸면 오류가 아니라 '검출 0건'처럼 보였다."""
    rows = ws.iter_rows(values_only=True)
    try:
        header = next(rows)
    except StopIteration:
        return [], []
    idx = {h: i for i, h in enumerate(header) if h}
    missing = [c for c in COLUMN_MAP if c not in idx]

    items = []
    for row in rows:
        if row is None or all(v is None for v in row):
            continue
        # NVD 취약점 검색 링크는 렌더러가 name/version으로 생성 (NVD URL 변경에 유연)
        item = {
            "name": "", "version": "", "license": [], "downloadLocation": "",
            "homepage": "", "copyright": "", "exclude": False, "comment": "",
            "paths": [],
        }
        for col, field in COLUMN_MAP.items():
            if col not in idx:
                continue
            value = row[idx[col]]
            text = "" if value is None else str(value).strip()
            if field == "license":
                item["license"] = [x.strip() for x in text.split(",") if x.strip()]
            elif field == "exclude":
                item["exclude"] = bool(text)
            else:
                item[field] = text
        for col in PATH_COLUMNS:
            if col in idx and row[idx[col]]:
                item["paths"].append(str(row[idx[col]]).strip())
        items.append(item)
    return items, missing


def build_normalized_report(output_dir, analyzed_path, mode_list):
    """(정규화 결과, 스키마 경고 목록)을 돌려준다.
    경고는 상류 리포트 구조가 우리가 아는 것과 달라졌을 때만 생긴다."""
    tool_info = {}
    items = {"source": [], "binary": [], "dependency": []}
    warnings = []

    # 검출 항목이 0건이면 fosslight가 최종 리포트 파일을 생성하지 않음 → 빈 결과로 처리
    reports = glob.glob(os.path.join(output_dir, "fosslight_report_*.xlsx"))
    if reports:
        latest = max(reports, key=os.path.getmtime)
        wb = load_workbook(latest, read_only=True)
        matched, unknown = [], []
        for ws in wb.worksheets:
            if ws.title in SHEET_TO_SCANNER:
                matched.append(ws.title)
                parsed, missing = _parse_sheet(ws)
                items[SHEET_TO_SCANNER[ws.title]] = parsed
                if missing:
                    warnings.append(
                        f"리포트 시트 '{ws.title}'에 예상 컬럼이 없습니다: {', '.join(missing)}. "
                        "FOSSLight Scanner의 출력 형식이 바뀐 것으로 보이며, "
                        "해당 항목이 비어 있을 수 있습니다."
                    )
                elif parsed and not any(i["name"] for i in parsed):
                    warnings.append(
                        f"리포트 시트 '{ws.title}'에 {len(parsed)}행이 있지만 OSS 이름이 모두 비어 "
                        "있습니다. 출력 형식이 바뀌었을 수 있습니다."
                    )
            elif ws.title == "Scanner Info":
                for row in ws.iter_rows(values_only=True):
                    if row and row[0] and row[1] is not None:
                        tool_info[str(row[0])] = str(row[1])
            else:
                unknown.append(ws.title)
        wb.close()

        # 리포트는 만들어졌는데 아는 시트가 하나도 없고 모르는 시트만 있다 = 시트명이 바뀐 것.
        # 예전에는 이 경우 조용히 "검출 0건"으로 보여, 사용자가 '이슈 없음'으로 오해했다.
        if not matched and unknown:
            raise RuntimeError(
                "리포트에서 분석 결과 시트를 찾지 못했습니다"
                f"(발견된 시트: {', '.join(unknown)}). "
                "FOSSLight Scanner의 출력 형식이 바뀌어 GUI가 결과를 읽지 못하는 상태입니다. "
                "결과를 '0건'으로 잘못 표시하지 않기 위해 실패로 처리합니다."
            )

    return {
        "scanDate": datetime.now().isoformat(timespec="seconds"),
        "analyzedPath": analyzed_path,
        "modes": mode_list,
        "toolInfo": tool_info,
        "items": items,
    }, warnings


def normalize_report(output_dir, analyzed_path, mode_list, result_file=None):
    result, warnings = build_normalized_report(output_dir, analyzed_path, mode_list)
    result_path = result_file or os.path.join(output_dir, "gui_result.json")
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    return result_path, result, warnings
