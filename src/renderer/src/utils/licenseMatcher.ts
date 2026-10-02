import type { GuiResult } from '@shared/types'
import licenseData from '../data/licenses.ko.json'

export type LicenseCategory =
  'permissive' | 'weak-copyleft' | 'strong-copyleft' | 'restricted' | 'unknown'

export interface LicenseInfo {
  id: string
  name: string
  category: LicenseCategory
  obligations: string[]
}

export const CATEGORY_LABEL: Record<LicenseCategory, { label: string; risk: string }> = {
  permissive: { label: 'Permissive', risk: '낮음' },
  'weak-copyleft': { label: 'Weak Copyleft', risk: '중간' },
  'strong-copyleft': { label: 'Strong Copyleft', risk: '높음' },
  restricted: { label: 'Restricted', risk: '높음' },
  unknown: { label: '미분류', risk: '확인 필요' }
}

const licenses = licenseData.licenses as Record<
  string,
  { spdx?: string; name: string; category: string; obligations: string[] }
>
const aliases = licenseData.aliases as Record<string, string>

function resolveId(raw: string): string | undefined {
  const key = raw.trim().toLowerCase()
  const id = key in licenses ? key : aliases[key]
  return id && licenses[id] ? id : undefined
}

export function matchLicense(raw: string): LicenseInfo {
  const key = raw.trim().toLowerCase()
  const id = resolveId(raw)
  if (id) {
    const entry = licenses[id]
    return {
      id,
      name: entry.name,
      category: entry.category as LicenseCategory,
      obligations: entry.obligations
    }
  }
  return { id: key, name: raw.trim(), category: 'unknown', obligations: [] }
}

// 스캐너마다 같은 라이선스를 'EPL-1.0'으로도, 'Eclipse Public License - Version 1.0'으로도
// 적어 서로 다른 라이선스처럼 보인다. 아는 라이선스는 SPDX short ID로 맞추고(SPDX ID가 없는
// 항목은 이름), 모르는 라이선스는 원문을 그대로 둔다.
export function canonicalLicense(raw: string): string {
  const id = resolveId(raw)
  if (!id) return raw.trim()
  return licenses[id].spdx ?? licenses[id].name
}

// 화면·집계가 모두 같은 이름을 보도록 보고서를 받을 때 한 번 맞춘다.
// 한 항목에 같은 라이선스가 표기만 달리 두 번 있으면 하나로 합친다.
export function canonicalizeLicenses(report: GuiResult): GuiResult {
  const fix = <T extends { license: string[] }>(items: T[]): T[] =>
    items.map((item) => ({ ...item, license: [...new Set(item.license.map(canonicalLicense))] }))
  return {
    ...report,
    items: {
      ...report.items,
      source: fix(report.items.source),
      dependency: fix(report.items.dependency),
      binary: fix(report.items.binary)
    }
  }
}
