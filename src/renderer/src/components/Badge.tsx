import type { LicenseCategory } from '../utils/licenseMatcher'
import { CATEGORY_LABEL } from '../utils/licenseMatcher'

const CATEGORY_STYLE: Record<LicenseCategory, string> = {
  permissive: 'bg-emerald-100 text-emerald-700',
  'weak-copyleft': 'bg-amber-100 text-amber-700',
  'strong-copyleft': 'bg-red-100 text-red-700',
  restricted: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-200 text-gray-600'
}

export function RiskBadge({ category }: { category: LicenseCategory }): React.JSX.Element {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${CATEGORY_STYLE[category]}`}
    >
      {CATEGORY_LABEL[category].risk}
    </span>
  )
}

export function ExcludeBadge(): React.JSX.Element {
  return (
    <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
      제외
    </span>
  )
}
