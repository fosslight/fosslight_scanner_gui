import { create } from 'zustand'
import type { GuiResult, RecentScan, ScanEvent, ScanMode, ScanTargetType } from '@shared/types'

export type ScanStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled'
export type ToastTone = 'success' | 'error'

const MAX_LOG_LINES = 500
const MISSING_TOOL_WARNING = '설치되어 있지 않아'

function appendLogLines(existingLines: string[], nextEntries: Array<{ level: string; message: string }>): string[] {
  const nextLines = nextEntries.map((entry) => `[${entry.level}] ${entry.message}`)
  return [...existingLines, ...nextLines].slice(-MAX_LOG_LINES)
}

function appendWarnings(
  existingWarnings: string[],
  nextEntries: Array<{ level: string; message: string }>
): string[] {
  const nextWarnings = nextEntries
    .filter((entry) => entry.level === 'WARNING' && entry.message.includes(MISSING_TOOL_WARNING))
    .map((entry) => entry.message)

  return nextWarnings.length > 0 ? [...existingWarnings, ...nextWarnings] : existingWarnings
}

interface AppState {
  report: GuiResult | null
  lastResultFile: string | null
  recentScans: RecentScan[]
  toast: { message: string; tone: ToastTone } | null
  overviewHasNew: boolean
  scanStatus: ScanStatus
  scanPhase: string
  logLines: string[]
  warnings: string[]
  errorMessage: string
  // 스캔 폼 상태 (페이지 이동 후에도 유지)
  form: {
    targetType: ScanTargetType
    target: string
    gitRef: string
    gitRefType: 'branch' | 'tag' | null
    modes: ScanMode[]
    excludePaths: string[]
    outputDir: string
    kbUrl: string
    kbToken: string
  }
  setForm: (patch: Partial<AppState['form']>) => void
  setReport: (report: GuiResult | null) => void
  setRecentScans: (list: RecentScan[]) => void
  clearToast: () => void
  clearOverviewNew: () => void
  handleScanEvent: (e: ScanEvent) => void
  startScan: () => void
  markCancelled: () => void
}

export const useAppStore = create<AppState>((set) => ({
  report: null,
  lastResultFile: null,
  recentScans: [],
  toast: null,
  overviewHasNew: false,
  scanStatus: 'idle',
  scanPhase: '',
  logLines: [],
  warnings: [],
  errorMessage: '',
  form: {
    targetType: 'folder',
    target: '',
    gitRef: '',
    gitRefType: null,
    modes: ['source', 'dependency', 'binary'],
    excludePaths: [],
    outputDir: '',
    kbUrl: '',
    kbToken: ''
  },

  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  setReport: (report) => set({ report }),
  setRecentScans: (recentScans) => set({ recentScans }),
  clearToast: () => set({ toast: null }),
  clearOverviewNew: () => set({ overviewHasNew: false }),

  startScan: () =>
    set({
      report: null,
      lastResultFile: null,
      toast: null,
      scanStatus: 'running',
      scanPhase: 'starting',
      logLines: [],
      warnings: [],
      errorMessage: ''
    }),

  markCancelled: () => set({ scanStatus: 'cancelled', scanPhase: '' }),

  handleScanEvent: (e) =>
    set((s) => {
      if (s.scanStatus === 'cancelled' && e.type !== 'done') return s
      switch (e.type) {
        case 'phase':
          return { scanPhase: e.phase }
        case 'log': {
          const entries = [{ level: e.level, message: e.message }]
          const logLines = appendLogLines(s.logLines, entries)
          const warnings = appendWarnings(s.warnings, entries)
          return { logLines, warnings }
        }
        case 'log-batch': {
          const logLines = appendLogLines(s.logLines, e.entries)
          const warnings = appendWarnings(s.warnings, e.entries)
          return { logLines, warnings }
        }
        case 'error':
          return { errorMessage: e.message, logLines: [...s.logLines, `[ERROR] ${e.message}`] }
        case 'result':
          return {
            lastResultFile: e.resultFile,
            report: e.report ?? s.report
          }
        case 'done': {
          if (s.scanStatus === 'cancelled') return { scanPhase: '' }
          if (e.exitCode === 0 && !s.errorMessage) {
            return {
              scanStatus: 'success',
              scanPhase: '',
              overviewHasNew: true,
              toast: {
                tone: 'success',
                message: '스캔이 완료되었습니다. Overview에서 결과를 확인하세요.'
              }
            }
          }
          return {
            scanStatus: 'error',
            scanPhase: '',
            toast: {
              tone: 'error',
              message: '분석에 실패하였습니다.'
            },
            errorMessage: s.errorMessage || `스캔이 비정상 종료되었습니다 (코드 ${e.exitCode})`
          }
        }
        default:
          return s
      }
    })
}))
