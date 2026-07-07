import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { useAppStore } from '../store/appStore'
import { CATEGORY_LABEL, matchLicense, type LicenseCategory } from '../utils/licenseMatcher'

const CATEGORY_COLOR: Record<LicenseCategory, string> = {
  permissive: '#10b981',
  'weak-copyleft': '#f59e0b',
  'strong-copyleft': '#ef4444',
  restricted: '#dc2626',
  unknown: '#9ca3af'
}

export default function OverviewPage(): React.JSX.Element {
  const report = useAppStore((s) => s.report)
  const outputDir = useAppStore((s) => s.form.outputDir)
  const navigate = useNavigate()
  const TOP_LICENSE_MIN_CHART_HEIGHT = 260
  const TOP_LICENSE_ROW_HEIGHT = 30

  const stats = useMemo(() => {
    if (!report) return null
    const all = [...report.items.source, ...report.items.dependency, ...report.items.binary].filter(
      (i) => !i.exclude
    )

    const licenseCount = new Map<string, number>()
    const categoryCount = new Map<LicenseCategory, number>()
    for (const item of all) {
      for (const lic of item.license) {
        licenseCount.set(lic, (licenseCount.get(lic) ?? 0) + 1)
        const cat = matchLicense(lic).category
        categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1)
      }
    }

    const topLicenses = [...licenseCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    const categoryData = [...categoryCount.entries()].map(([cat, count]) => ({
      cat,
      name: `${CATEGORY_LABEL[cat].label} (${CATEGORY_LABEL[cat].risk})`,
      count
    }))

    const highRisk = all.filter((i) =>
      i.license.some((l) => {
        const c = matchLicense(l).category
        return c === 'strong-copyleft' || c === 'restricted'
      })
    ).length

    // 보안취약점(Vulnerability) 기능은 현재 미완성 상태로 비활성화합니다.
    // 추후 재활성화 시 아래 통계 계산 블록을 복구하세요.
    // const vuln = { total: 0, source: 0, dependency: 0, binary: 0 }
    // for (const scanner of ['source', 'dependency', 'binary'] as const) {
    //   const n = report.items[scanner].filter((i) => !i.exclude && i.name).length
    //   vuln[scanner] = n
    //   vuln.total += n
    // }

    return { uniqueLicenses: licenseCount.size, topLicenses, categoryData, highRisk }
  }, [report])

  if (!report || !stats) return <EmptyState />

  const topLicenseChartHeight = Math.max(
    TOP_LICENSE_MIN_CHART_HEIGHT,
    stats.topLicenses.length * TOP_LICENSE_ROW_HEIGHT
  )

  const openResultFolder = async (): Promise<void> => {
    if (!outputDir) {
      window.alert('저장 경로가 없습니다. New Scan에서 저장 경로를 먼저 설정해 주세요.')
      return
    }
    const error = await window.api.openPath(outputDir)
    if (error) {
      window.alert(`경로를 열 수 없습니다: ${error}`)
    }
  }

  function FolderIcon(): React.JSX.Element {
    return (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Overview"
        description={`분석 경로: ${report.analyzedPath} · ${report.scanDate.replace('T', ' ')}`}
      >
        <button
          onClick={() => void openResultFolder()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!outputDir}
          title={outputDir || 'New Scan에서 저장 경로를 설정해 주세요'}
        >
          <FolderIcon />
          Result file
        </button>
      </PageHeader>

      <h2 className="mb-3 text-lg font-semibold text-gray-800">Open Source 검출</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Source 검출"
          value={report.items.source.length}
          onClick={() => navigate('/results/source')}
        />
        <StatCard
          label="Dependency 검출"
          value={report.items.dependency.length}
          onClick={() => navigate('/results/dependency')}
        />
        <StatCard
          label="Binary 검출"
          value={report.items.binary.length}
          onClick={() => navigate('/results/binary')}
        />
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-gray-800">
        License 정보
        <span className="ml-2 text-sm font-normal text-gray-500">
          고유 라이선스 {stats.uniqueLicenses}종
        </span>
      </h2>

      {stats.highRisk > 0 && (
        <button
          onClick={() => navigate('/risk/license')}
          className="mb-4 w-full rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-left text-sm text-red-700 hover:bg-red-100"
        >
          ⚠️ <b>{stats.highRisk}건</b>의 항목에 높은 위험도의 라이선스(Strong Copyleft/Restricted)가
          포함되어 있습니다. 클릭하여 확인하세요.
        </button>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-gray-700">라이선스 위험도 분포</div>
          {stats.categoryData.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {stats.categoryData.map((d) => (
                    <Cell key={d.cat} fill={CATEGORY_COLOR[d.cat]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-gray-700">상위 라이선스 (항목 수)</div>
          {stats.topLicenses.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">데이터 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={topLicenseChartHeight}>
              <BarChart
                data={stats.topLicenses}
                layout="vertical"
                margin={{ top: 8, right: 8, bottom: 8, left: 30 }}
                barCategoryGap="24%"
              >
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={130} fontSize={11} tickMargin={6} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/*
        Vulnerability 기능은 현재 미완성 상태로 Overview 노출을 숨깁니다.
        추후 재활성화 시 아래 섹션을 복구하세요.

        <h2 className="mt-8 mb-3 text-lg font-semibold text-gray-800">보안취약점 (Vulnerability)</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {stats.vuln.total === 0 ? (
            <div className="text-sm text-gray-500">
              취약점 조회 가능한 항목이 없습니다 (OSS 이름이 검출된 항목만 조회 대상입니다).
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">NVD 취약점 조회 대상 OSS</div>
                <div className="mt-1 text-3xl font-bold text-gray-900">{stats.vuln.total}건</div>
                <div className="mt-1 text-xs text-gray-400">
                  Source {stats.vuln.source} · Dependency {stats.vuln.dependency} · Binary{' '}
                  {stats.vuln.binary} — 취약점 상세는 항목별 NVD 링크에서 확인하세요
                </div>
              </div>
              <button
                onClick={() => navigate('/risk/vulnerability')}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-accent hover:bg-accent-soft"
              >
                Vulnerability 페이지 열기 →
              </button>
            </div>
          )}
        </div>
      */}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-xs text-gray-500 shadow-sm">
        <div className="mb-1 font-semibold text-gray-600">스캐너 정보</div>
        {Object.entries(report.toolInfo)
          .filter(([k]) => k !== 'Comment')
          .map(([k, v]) => (
            <div key={k}>
              {k}: {v}
            </div>
          ))}
      </div>
    </div>
  )
}
