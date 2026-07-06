// main / preload / renderer가 공유하는 타입 정의

export type ScanMode = 'source' | 'dependency' | 'binary'

export type ScanTargetType = 'folder' | 'archive' | 'url'

export interface ScanConfig {
  targetType: ScanTargetType
  target: string // 폴더 경로, 압축파일 경로 또는 URL
  modes: ScanMode[] // 3개 모두 선택 시 'all'로 실행
  excludePaths: string[]
  outputDir: string
}

// Python 래퍼가 stdout으로 내보내는 NDJSON 이벤트
export type ScanEvent =
  | { type: 'phase'; phase: string; modes?: string[] }
  | { type: 'log'; level: string; message: string }
  | { type: 'error'; message: string; traceback?: string }
  | { type: 'result'; resultFile: string }
  | { type: 'done'; exitCode: number } // Electron이 프로세스 종료 시 합성

// gui_result.json 스키마 (Python 래퍼가 정규화하여 생성)
export interface OssItem {
  name: string
  version: string
  license: string[]
  downloadLocation: string
  homepage: string
  copyright: string
  exclude: boolean
  comment: string
  paths: string[]
}

export interface GuiResult {
  scanDate: string
  analyzedPath: string
  modes: string[]
  toolInfo: Record<string, string>
  items: {
    source: OssItem[]
    dependency: OssItem[]
    binary: OssItem[]
  }
}

export interface RecentScan {
  date: string
  analyzedPath: string
  resultFile: string
}
