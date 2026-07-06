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
  { name: string; category: string; obligations: string[] }
>
const aliases = licenseData.aliases as Record<string, string>

export function matchLicense(raw: string): LicenseInfo {
  const key = raw.trim().toLowerCase()
  const id = key in licenses ? key : aliases[key]
  if (id && licenses[id]) {
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
