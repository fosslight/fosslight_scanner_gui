import { BrowserWindow, shell } from 'electron'
import noticePath from '../../OSS_Notice.html?asset'
import icon from '../../resources/fosslight_logo.png?asset'

let noticeWindow: BrowserWindow | null = null

function isWebUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

// 오픈소스 고지문(정적 HTML)을 별도 창으로 연다. 이미 열려 있으면 앞으로 가져온다.
// 앱 화면에 넣으면 고지문 자체 스타일과 앱 스타일이 섞이므로 문서 그대로 띄운다.
export function openOssNotice(parent: BrowserWindow | null): void {
  if (noticeWindow && !noticeWindow.isDestroyed()) {
    if (noticeWindow.isMinimized()) noticeWindow.restore()
    noticeWindow.focus()
    return
  }

  noticeWindow = new BrowserWindow({
    width: 960,
    height: 760,
    minWidth: 640,
    minHeight: 480,
    title: 'Open Source Notice - FOSSLight Scanner',
    parent: parent ?? undefined,
    autoHideMenuBar: true,
    ...((process.platform === 'linux' || process.platform === 'win32') ? { icon } : {}),
    // 정적 문서라 preload(앱 API)를 주지 않는다
    webPreferences: { sandbox: true }
  })

  // 외부 링크는 앱 안에서 열지 않고 기본 브라우저로 넘긴다.
  // target="_blank" 링크는 새 창 요청으로 들어온다.
  noticeWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  // target 없는 링크도 고지문 창이 다른 페이지로 바뀌지 않게 막는다.
  // 목차의 #앵커 이동은 문서 내 이동이라 이 이벤트가 발생하지 않는다.
  noticeWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    if (isWebUrl(url)) void shell.openExternal(url)
  })

  noticeWindow.on('closed', () => {
    noticeWindow = null
  })
  void noticeWindow.loadFile(noticePath)
}
