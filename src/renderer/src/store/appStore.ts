import { create } from 'zustand'
import type { GuiResult, RecentScan, ScanEvent, ScanMode, ScanTargetType } from '@shared/types'

export type ScanStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled'

const MAX_LOG_LINES = 500

interface AppState {
  report: GuiResult | null
  recentScans: RecentScan[]
  scanStatus: ScanStatus
  scanPhase: string
  logLines: string[]
  warnings: string[]
  errorMessage: string
  // 스캔 폼 상태 (페이지 이동 후에도 유지)
  form: {
    targetType: ScanTargetType
    target: string
    modes: ScanMode[]
    excludePaths: string[]
    outputDir: string
  }
  setForm: (patch: Partial<AppState['form']>) => void
  setReport: (report: GuiResult | null) => void
  setRecentScans: (list: RecentScan[]) => void
  handleScanEvent: (e: ScanEvent) => void
  startScan: () => void
  markCancelled: () => void
}

export const useAppStore = create<AppState>((set) => ({
  report: null,
  recentScans: [],
  scanStatus: 'idle',
  scanPhase: '',
  logLines: [],
  warnings: [],
  errorMessage: '',
  form: {
    targetType: 'folder',
    target: '',
    modes: ['source', 'dependency', 'binary'],
    excludePaths: [],
    outputDir: ''
  },

  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  setReport: (report) => set({ report }),
  setRecentScans: (recentScans) => set({ recentScans }),

  startScan: () =>
    set({
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
          const line = `[${e.level}] ${e.message}`
          const logLines = [...s.logLines, line].slice(-MAX_LOG_LINES)
          const warnings =
            e.level === 'WARNING' && e.message.includes('설치되어 있지 않아')
              ? [...s.warnings, e.message]
              : s.warnings
          return { logLines, warnings }
        }
        case 'error':
          return { errorMessage: e.message, logLines: [...s.logLines, `[ERROR] ${e.message}`] }
        case 'done': {
          if (s.scanStatus === 'cancelled') return { scanPhase: '' }
          if (e.exitCode === 0 && !s.errorMessage) return { scanStatus: 'success', scanPhase: '' }
          return {
            scanStatus: 'error',
            scanPhase: '',
            errorMessage: s.errorMessage || `스캔이 비정상 종료되었습니다 (코드 ${e.exitCode})`
          }
        }
        default:
          return s
      }
    })
}))
