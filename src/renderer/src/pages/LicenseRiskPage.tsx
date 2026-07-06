import { Fragment, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { RiskBadge } from '../components/Badge'
import { useAppStore } from '../store/appStore'
import { CATEGORY_LABEL, matchLicense, type LicenseInfo } from '../utils/licenseMatcher'
import type { OssItem } from '@shared/types'

interface LicenseGroup {
  raw: string
  info: LicenseInfo
  items: { scanner: string; item: OssItem }[]
}

const CATEGORY_ORDER = ['unknown', 'restricted', 'strong-copyleft', 'weak-copyleft', 'permissive']

export default function LicenseRiskPage(): React.JSX.Element {
  const report = useAppStore((s) => s.report)
  const [expanded, setExpanded] = useState<string | null>(null)

  const groups = useMemo(() => {
    if (!report) return []
    const map = new Map<string, LicenseGroup>()
    const scanners = ['source', 'dependency', 'binary'] as const
    for (const scanner of scanners) {
      for (const item of report.items[scanner]) {
        if (item.exclude) continue
        for (const lic of item.license) {
          const key = lic.trim()
          if (!map.has(key)) {
            map.set(key, { raw: key, info: matchLicense(key), items: [] })
          }
          map.get(key)!.items.push({ scanner, item })
        }
      }
    }
    return [...map.values()].sort((a, b) => {
      const ca = CATEGORY_ORDER.indexOf(a.info.category)
      const cb = CATEGORY_ORDER.indexOf(b.info.category)
      if (ca !== cb) return ca - cb
      return b.items.length - a.items.length
    })
  }, [report])

  if (!report) return <EmptyState />

  const unknownCount = groups.filter((g) => g.info.category === 'unknown').length

  return (
    <div className="p-8">
      <PageHeader
        title="License Risk"
        description="검출된 라이선스별 위험도와 의무사항입니다. 위험도가 높은 순으로 정렬됩니다."
      />

      {unknownCount > 0 && (
        <div className="mb-4 rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700">
          분류되지 않은 라이선스가 <b>{unknownCount}종</b> 있습니다 — 수동 검토가 필요합니다.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-600">라이선스</th>
              <th className="w-24 px-4 py-2.5 text-left font-semibold text-gray-600">위험도</th>
              <th className="w-40 px-4 py-2.5 text-left font-semibold text-gray-600">분류</th>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-600">주요 의무사항</th>
              <th className="w-20 px-4 py-2.5 text-right font-semibold text-gray-600">항목 수</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.raw}>
                <tr
                  onClick={() => setExpanded(expanded === g.raw ? null : g.raw)}
                  className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5 font-medium text-gray-800">{g.raw}</td>
                  <td className="px-4 py-2.5">
                    <RiskBadge category={g.info.category} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {CATEGORY_LABEL[g.info.category].label}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {g.info.obligations.length === 0 ? (
                        <span className="text-xs text-gray-400">
                          {g.info.category === 'unknown' ? '수동 검토 필요' : '-'}
                        </span>
                      ) : (
                        g.info.obligations.map((o) => (
                          <span
                            key={o}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                          >
                            {o}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{g.items.length}</td>
                </tr>
                {expanded === g.raw && (
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <td colSpan={5} className="px-6 py-3">
                      <div className="max-h-48 overflow-y-auto text-xs text-gray-600">
                        {g.items.map(({ scanner, item }, i) => (
                          <div key={i} className="py-0.5">
                            <span className="mr-2 inline-block w-20 text-gray-400">
                              [{scanner}]
                            </span>
                            {item.name || item.paths.join(', ')}
                            {item.version && ` @ ${item.version}`}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  검출된 라이선스가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
