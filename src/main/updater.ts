import { app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

// 앱 시작 시 GitHub Release의 latest.yml 기준으로 신규 버전을 확인하고,
// 사용자 승인 시 다운로드 → 재시작+설치를 진행한다.
// 확인 실패(오프라인, latest.yml 없는 과거 릴리스 등)는 조용히 무시한다.
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  const baseTitle = mainWindow.getTitle()

  autoUpdater.on('update-available', (info) => {
    void dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: '업데이트 확인',
        message: `새 버전 v${info.version}이(가) 있습니다.`,
        detail:
          `현재 버전: v${app.getVersion()}\n` +
          '새 버전에는 최신 FOSSLight Scanner가 포함됩니다.\n' +
          '지금 다운로드할까요? (다운로드 중에도 앱을 계속 사용할 수 있습니다)',
        buttons: ['다운로드', '나중에'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate().catch(() => {
            /* 다운로드 실패는 error 이벤트에서 로그 */
          })
        }
      })
  })

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow.isDestroyed()) return
    mainWindow.setProgressBar(progress.percent / 100)
    mainWindow.setTitle(`${baseTitle} — 업데이트 다운로드 중 ${Math.round(progress.percent)}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1)
      mainWindow.setTitle(baseTitle)
    }
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
    if (!mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1)
      mainWindow.setTitle(baseTitle)
    }
    console.error('[updater]', err.message)
  })

  autoUpdater.checkForUpdates().catch(() => {
    /* 오프라인, latest.yml 없음 등 — 조용히 무시 */
  })
}
