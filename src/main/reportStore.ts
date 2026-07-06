import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { GuiResult, RecentScan } from '../shared/types'

const MAX_RECENT = 10

function recentFilePath(): string {
  return join(app.getPath('userData'), 'recent-scans.json')
}

export function getRecentScans(): RecentScan[] {
  try {
    const raw = readFileSync(recentFilePath(), 'utf-8').replace(/^\uFEFF/, '')
    const list = JSON.parse(raw) as RecentScan[]
    return list.filter((r) => existsSync(r.resultFile))
  } catch {
    return []
  }
}

export function addRecentScan(entry: RecentScan): void {
  const list = getRecentScans().filter((r) => r.resultFile !== entry.resultFile)
  list.unshift(entry)
  writeFileSync(recentFilePath(), JSON.stringify(list.slice(0, MAX_RECENT), null, 2), 'utf-8')
}

export function loadReport(resultFile?: string): GuiResult | null {
  const target = resultFile ?? getRecentScans()[0]?.resultFile
  if (!target || !existsSync(target)) return null
  try {
    return JSON.parse(readFileSync(target, 'utf-8').replace(/^\uFEFF/, '')) as GuiResult
  } catch {
    return null
  }
}
