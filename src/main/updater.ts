import { app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { cancelScan, isScanRunning } from './scanRunner'

// 앱 시작 시 GitHub Release의 latest.yml 기준으로 신규 버전을 확인하고,
// 사용자 승인 시 다운로드 → 재시작+설치를 진행한다.
// 확인 실패(오프라인, latest.yml 없는 과거 릴리스 등)는 조용히 무시한다.
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  let downloading = false
  let progressWin: BrowserWindow | null = null

  const preventMainClose = (e: Electron.Event): void => {
    if (downloading) e.preventDefault()
  }
  mainWindow.on('close', preventMainClose)

  const closeProgressWin = (): void => {
    if (progressWin && !progressWin.isDestroyed()) {
      progressWin.destroy()
    }
    progressWin = null
  }

  const unlockApp = (): void => {
    downloading = false
    closeProgressWin()
    if (!mainWindow.isDestroyed()) {
      mainWindow.setEnabled(true)
      mainWindow.setProgressBar(-1)
    }
  }

  const showProgressWin = (): void => {
    closeProgressWin()

    progressWin = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 420,
      height: 180,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      autoHideMenuBar: true,
      show: false,
      title: '업데이트 다운로드',
      webPreferences: {
        sandbox: true,
        contextIsolation: true
      }
    })

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", sans-serif;
      background: #1e2430;
      color: #e8eaed;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      user-select: none;
      -webkit-app-region: no-drag;
    }
    .box { width: 100%; padding: 24px 28px; }
    h1 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
    p { font-size: 12px; color: #9aa3b2; margin-bottom: 18px; line-height: 1.45; }
    .track {
      height: 10px;
      background: #2a3344;
      border-radius: 5px;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      width: 0%;
      background: #3b82f6;
      border-radius: 5px;
      transition: width 0.15s ease-out;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 12px;
      color: #c4cad4;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>업데이트를 다운로드하는 중…</h1>
    <p>다운로드가 끝날 때까지 앱을 사용할 수 없습니다.<br />창을 닫거나 다른 작업을 하지 마세요.</p>
    <div class="track"><div class="bar" id="bar"></div></div>
    <div class="row">
      <span id="label">준비 중…</span>
      <span id="pct">0%</span>
    </div>
  </div>
</body>
</html>`

    progressWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    progressWin.once('ready-to-show', () => {
      if (progressWin && !progressWin.isDestroyed()) progressWin.show()
    })
  }

  const updateProgressUi = (percent: number, transferred: number, total: number): void => {
    const pct = Math.max(0, Math.min(100, Math.round(percent)))
    const transferredMb = (transferred / (1024 * 1024)).toFixed(1)
    const totalMb = total > 0 ? (total / (1024 * 1024)).toFixed(1) : '?'
    const label = `${transferredMb} MB / ${totalMb} MB`
    if (progressWin && !progressWin.isDestroyed()) {
      void progressWin.webContents.executeJavaScript(
        `document.getElementById('bar').style.width='${pct}%';` +
          `document.getElementById('pct').textContent='${pct}%';` +
          `document.getElementById('label').textContent=${JSON.stringify(label)};`
      )
    }
  }

  const lockAppAndDownload = (): void => {
    downloading = true
    if (isScanRunning()) cancelScan()
    if (!mainWindow.isDestroyed()) {
      mainWindow.setEnabled(false)
    }
    showProgressWin()
    autoUpdater.downloadUpdate().catch(() => {
      /* 다운로드 실패는 error 이벤트에서 처리 */
    })
  }

  autoUpdater.on('update-available', (info) => {
    void dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: '업데이트 확인',
        message: `새 버전 v${info.version}이(가) 있습니다.`,
        detail:
          `현재 버전: v${app.getVersion()}\n` +
          '새 버전에는 최신 FOSSLight Scanner가 포함됩니다.\n' +
          '지금 다운로드할까요? (다운로드 중에는 앱을 사용할 수 없습니다)',
        buttons: ['다운로드', '나중에'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) lockAppAndDownload()
      })
  })

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow.isDestroyed()) return
    mainWindow.setProgressBar(progress.percent / 100)
    updateProgressUi(progress.percent, progress.transferred, progress.total)
  })

  autoUpdater.on('update-downloaded', (info) => {
    unlockApp()
    void dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: '업데이트 준비 완료',
        message: `v${info.version} 다운로드가 완료되었습니다.`,
        detail: '지금 재시작하면 설치 마법사가 표시됩니다. 진행 중인 스캔이 있다면 중단됩니다.',
        buttons: ['지금 재시작', '나중에'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall(false, true)
        }
      })
  })

  autoUpdater.on('error', (err) => {
    const wasDownloading = downloading
    unlockApp()
    console.error('[updater]', err.message)
    if (wasDownloading && !mainWindow.isDestroyed()) {
      void dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: '업데이트 실패',
        message: '업데이트 다운로드에 실패했습니다.',
        detail: err.message,
        buttons: ['확인']
      })
    }
  })

  autoUpdater.checkForUpdates().catch(() => {
    /* 오프라인, latest.yml 없음 등 — 조용히 무시 */
  })
}
