# FOSSLight Scanner GUI

A Windows desktop app that finds open source and licenses in a project. Choose a folder or file, click **스캔 시작** (Start scan), review the results on screen, and save them as an Excel report.

You do not need to install Python or the scanners separately. The analysis engine is included in the installer.

- Installer: `fosslight-scanner-gui-<version>-setup.exe` from [Releases](https://github.com/fosslight/fosslight_scanner_gui/releases)
- Supported environment: Windows 10 / 11 (64-bit)

## What it analyzes

One scan can cover all three of the following. You can also run only the ones you need.

| Analysis | What it looks at | When to turn it on |
|:---------|:-----------------|:-------------------|
| **Source Code** | License text, copyright, and code snippets in source files | When you analyze a source folder as it is |
| **Dependency** | Libraries declared in files such as `package.json` and `pom.xml`, and their transitive libraries | When you need to check open source pulled in as packages |
| **Binary** | A list of binary files and known open source information | When the target includes build outputs or library files |

There are three kinds of analysis targets.

- A folder on your PC
- An archive (zip, tar, tar.gz, tgz, tar.bz2, tar.xz, bz2, jar, whl, rpm, src.rpm)
- A URL (starting with `https://` or `git@`). A Git repository is cloned and then analyzed. If the URL ends with an archive, that file is downloaded and analyzed.

## Installation

1. Download `fosslight-scanner-gui-<version>-setup.exe` from [Releases](https://github.com/fosslight/fosslight_scanner_gui/releases). The file is about 259MB.
2. Run the installer. If **Windows protected your PC** appears, click **More info** and then **Run anyway**. This notice is shown for installers that are not code-signed.
3. Confirm the install location and click **Install**. The default location is `AppData\Local\Programs\fosslight-scanner-gui` under your user folder. You can change it in the setup screen. Administrator rights are not required.
4. When setup finishes, start **FOSSLight Scanner** from the desktop or the Start menu.

Installation itself does not require an internet connection. After installation the app uses about 1GB, most of which is the license data used for Source analysis.

An internet connection is required when the app fetches a project from a URL or installs a missing development tool. Analyzing a Git repository URL requires [Git](https://git-scm.com/download/win) on the PC. An archive URL works without Git.

## Run a scan

Open **New Scan** from the left menu.

![New Scan](images/1_gui_new_scan.png)

1. Under **분석 대상** (Analysis target), choose **폴더** (Folder), **압축파일** (Archive), or **URL**.
   - **Folder**: click **폴더 선택** (Choose folder) and select the project folder. The report output folder is filled in with that folder.
   - **Archive**: click **파일 선택** (Choose file) and select a file such as zip, tar.gz, or jar. The app extracts it and then analyzes it. The report is saved in the folder that contains the file.
   - **URL**: enter the address. For a Git repository you can enter a **Branch or Tag**. Leave it empty to use the default branch. When the field loses focus, the app checks that the branch or tag exists. If it does not, similar names are shown and the scan does not start.
2. Under **분석 유형** (Analysis type), choose what to run. All three are selected by default. At least one must stay selected.
3. When Source Code is selected, **KB URL** and **KB Token** are shown. Enter them only if your organization gave you an address and a token. If you leave them empty, Source analysis runs without that server.
4. To skip a folder, enter it under **제외 경로** (Exclude paths) and click **추가** (Add). Enter also adds the path. Example: `node_modules`
5. Check **리포트 저장 위치** (Report output folder). A folder or an archive fills this in automatically. For a URL, choose the folder yourself with **폴더 선택** (Choose folder).
6. Click **스캔 시작** (Start scan).

URL examples:

- Git repository: `https://github.com/fosslight/fosslight_scanner`
- A specific tag: use the URL above and enter `v2.1.25` in Branch or Tag
- An archive URL: `https://github.com/fosslight/fosslight_scanner/archive/refs/tags/v2.1.25.zip`

If **스캔 시작** (Start scan) is disabled, the analysis target or the output folder is empty, or the Branch or Tag check has not finished.

## While a scan is running

After the scan starts, the steps are shown as **다운로드** (Download) → **도구 설치** (Install tools) → **준비** (Prepare) → **분석** (Analyze) → **결과 정리** (Normalize results). Download and tool installation run only when they are needed. **스캔 진행 중...** (Scan in progress...) appears under the left menu.

Depending on the project size, a scan can take from several minutes to several tens of minutes. The on-screen log is also written to `fosslight_gui_<timestamp>.log` in the output folder.

**취소** (Cancel) asks for confirmation and then stops the work. The screen shows **스캔이 취소되었습니다.** (The scan was cancelled.)

When the scan ends, the screen distinguishes the outcome as follows.

- **Red banner**: the scan did not finish. Read the message and run it again.
- **Yellow warning**: the analysis finished and a report was created. A tool was missing or its installation failed. Only that package's dependencies may be missing, so read the warning.
- After a successful scan, **New** appears next to **Overview** in the left menu. Open that screen to review the results.

When you start the app again, it opens the last successful scan result.

## Review the results

### Start with Overview

![Overview](images/2_gui_overview.png)

**Overview** is the summary of this scan.

- **Open Source 검출** (Open source detected): counts found by Source, Dependency, and Binary. Click a card to open that list.
- **License 정보** (License information): how many distinct licenses were found, how risk is distributed, and which licenses have the most items. If a Strong Copyleft or Restricted license is present, a red warning is shown. Clicking it opens the License screen.
- **Result file**: opens the report folder in File Explorer.
- **스캐너 정보** (Scanner information): which scanners ran, and what the analysis path and exclude paths were.

Items skipped by an exclude path, and items marked Exclude, are left out of these statistics.

If a high-risk license is present, open the License screen first, then review the Source, Dependency, and Binary lists that have detections.

### Detection lists

![Scan result](images/3_gui_scan_result.png)

The number next to **Source**, **Dependency**, and **Binary** in the left menu is the detection count. The list shows 50 rows per page.

- Use the search box to find a path, OSS name, or license.
- Click a column header to sort.
- Click a row to expand Download Location, Homepage, Copyright, and Comment.
- Rows marked Exclude are dimmed.

The path column name differs by screen. Source uses **Source Path**, Dependency uses **Package URL**, and Binary uses **Binary Path**.

### License obligations

![License Risk](images/4_gui_license_risk.png)

The **License** screen groups detected licenses with higher risk first. The main obligations are shown next to each license. Click a row to expand the items where that license was found.

| Category | Risk shown on screen | How to read it |
|:---------|:---------------------|:---------------|
| Restricted | High (높음) | The terms of use are strict. Check the obligations before you distribute. |
| Copyleft | High (높음) | Modifying it or distributing it together may require you to disclose source code. |
| Weak Copyleft | Medium (중간) | The library itself has obligations. How far those obligations reach into the code that uses it depends on the license. |
| Permissive | Low (낮음) | The main requirements are often copyright and license notices. |
| Unclassified (미분류) | Needs review (확인 필요) | A name the app could not classify. Check it yourself, as the notice at the top of the screen says. |

Unclassified licenses are not hidden. Above the table, the screen says **분류되지 않은 라이선스가 있습니다** (There are unclassified licenses).

## Files that are saved

The following files are created in **리포트 저장 위치** (Report output folder). You can open that folder from **Result file** on Overview.

| File | Purpose |
|:-----|:--------|
| `fosslight_report_*.xlsx` | The Excel report for this analysis. It can be uploaded to [FOSSLight Hub](https://fosslight.org/hub-guide/learn/2_fosslight_report.html). |
| `fosslight_report_*.yaml` | The same result as YAML. |
| `fosslight_gui_<timestamp>.log` | The log that was shown on the scan screen. Open it to review warnings or the cause of a failure. |
| `gui_result.json` | The file the app reads when it opens the result again. |

The table on screen and the Excel file are the same analysis result. Use the Excel file when you upload it to Hub or share it with someone else.

## Programs required for dependency analysis

When **Dependency** is turned on, the app checks which programs the files in the project need. If one is missing, it prepares it before analysis starts. An archive or a URL is checked the same way after it has been fetched. A failed preparation does not stop the whole scan. Only that package type may fail, and the app reports it as a yellow warning.

If Windows asks for permission, allow it so the installation can continue.

| File in the project | Required program | If it is missing |
|:--------------------|:-----------------|:-----------------|
| package.json | Node.js (npm) | The app installs it. If the installer tool cannot be used, it downloads a file and uses it only for this analysis. |
| pom.xml | Apache Maven, Java | If neither the Maven Wrapper (`mvnw`) nor an already installed Maven is available, the app prepares Maven. It also prepares Java if Java is missing. |
| build.gradle, build.gradle.kts | Java | The app does not install Gradle. It uses the Gradle Wrapper in the project. It prepares Java if Java is missing. |
| requirements.txt, setup.py, setup.cfg, pyproject.toml, Pipfile | Python | Analysis uses the Python bundled in the app. A separate install is not required. |
| go.mod | Go | The app installs it. |
| Chart.yaml | Helm | The app installs it. |
| Cargo.toml | Rust (cargo) | The app installs it. |
| Gemfile | Ruby | The app installs it. |
| pubspec.yaml | Flutter | The app does not install it automatically. Install it using the [Flutter Windows install guide](https://docs.flutter.dev/get-started/install/windows), then scan again. |
| Podfile, Podfile.lock | CocoaPods | Cannot be analyzed on Windows. Analyze it on macOS. |

## Updates and uninstall

When the app starts, it checks whether a newer version exists. If one does, choose **다운로드** (Download) or **나중에** (Later).

While **다운로드** (Download) is in progress, the app cannot be used. When the download finishes, **지금 재시작** (Restart now) opens the setup wizard. Restarting stops a scan that is still running. If there is no internet connection, or the check fails, the app continues on the current version without a message.

To uninstall, remove **FOSSLight Scanner** from Windows **Settings > Apps > Installed apps**, or run `Uninstall FOSSLight Scanner.exe` in the install folder. Excel files and logs created by analysis stay in the report output folder.

## If something goes wrong

**Windows protected your PC during installation.**  
Continue with **More info → Run anyway**.

**A scan does not start from a Git URL.**  
A Git repository URL requires Git on the PC. A URL that ends with an archive can be downloaded without Git. If you entered a Branch or Tag, click outside the field once and check that the lookup finished. If it says **유효하지 않음** (Invalid), enter one of the similar names it suggests.

**The log contains WARNING.**  
If a report file was created, the analysis finished. A WARNING is a notice to check, such as a missing tool. A failed scan is shown separately with a red banner.

**The Dependency result is empty.**  
The package program for that project could not be prepared, or it is a tool that is not installed automatically, such as Flutter or CocoaPods. Read the yellow warning on the scan screen and the log, install the required program, and scan again.

**The installed size is large.**  
The license data for Source analysis accounts for most of the size. The installer ships that data compressed, and installation extracts it.

**A result you viewed before does not open again.**  
Only the last successful scan opens automatically. A scan that was cancelled or ended with an error keeps the previous successful result. You can open a saved Excel file directly from the **Result file** folder.

If the problem remains, click the GitHub icon at the bottom left of the app or open an [issue](https://github.com/fosslight/fosslight_scanner_gui/issues). Attaching `fosslight_gui_<timestamp>.log` from the output folder makes the cause easier to find. Hover over the version at the bottom left to see the app version and the bundled scanner versions.

Build and internal structure are described in [docs/](docs/README.md).

## License

This project is licensed under [Apache-2.0](LICENSE).

For the 3rd party licenses included when the app is distributed as an installer, see [OSS_Notice.html](OSS_Notice.html).
