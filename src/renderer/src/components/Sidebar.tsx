import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../store/appStore'

const GITHUB_ISSUES_URL = 'https://github.com/fosslight/fosslight_scanner_gui/issues'

interface NavItem {
  to: string
  label: string
  count?: number
  isNew?: boolean
}

function NavEntry({ to, label, count, isNew }: NavItem): React.JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-sidebar-hover font-semibold text-white border-l-2 border-accent'
            : 'text-gray-400 hover:bg-sidebar-hover hover:text-gray-200'
        }`
      }
    >
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {isNew && (
          <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            New
          </span>
        )}
      </span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">{count}</span>
      )}
    </NavLink>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mt-5 mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
      {children}
    </div>
  )
}

function GithubIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export default function Sidebar(): React.JSX.Element {
  const report = useAppStore((s) => s.report)
  const scanStatus = useAppStore((s) => s.scanStatus)
  const overviewHasNew = useAppStore((s) => s.overviewHasNew)
  const [version, setVersion] = useState('')
  const [scannerVersions, setScannerVersions] = useState<Record<string, string | null> | null>(null)

  useEffect(() => {
    void window.api.getAppVersion().then(setVersion)
    void window.api.getScannerVersions().then(setScannerVersions)
  }, [])

  const formatVersion = (v: string | null | undefined): string => {
    if (!v) return '-'
    return v.startsWith('v') ? v : `v${v}`
  }

  const counts = {
    source: report?.items.source.length ?? 0,
    dependency: report?.items.dependency.length ?? 0,
    binary: report?.items.binary.length ?? 0
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar px-3 py-4">
      <div className="mb-2 px-3">
        <div className="text-base font-bold text-white">FOSSLight Scanner</div>
        <div className="text-xs text-gray-500">오픈소스 분석 도구</div>
      </div>

      <nav className="flex-1">
        <SectionTitle>메뉴</SectionTitle>
        <NavEntry to="/scan" label="New Scan" />

        <SectionTitle>Scan Results</SectionTitle>
        <NavEntry to="/" label="Overview" isNew={overviewHasNew} />
        <NavEntry to="/results/source" label="Source" count={counts.source} />
        <NavEntry to="/results/dependency" label="Dependency" count={counts.dependency} />
        <NavEntry to="/results/binary" label="Binary" count={counts.binary} />

        <SectionTitle>Compliance</SectionTitle>
        <NavEntry to="/risk/license" label="License" />
        {/*
          Vulnerability 기능은 현재 미완성 상태로 메뉴에서 숨깁니다.
          추후 재활성화 시 아래 NavEntry를 복구하세요.
          <NavEntry to="/risk/vulnerability" label="Vulnerability" />
        */}
      </nav>

      {scanStatus === 'running' && (
        <div className="mx-1 mb-2 flex items-center gap-2 rounded-lg bg-sidebar-hover px-3 py-2 text-xs text-gray-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          스캔 진행 중...
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-700/60 px-3 pt-3">
        <div className="group relative">
          <span className="cursor-default text-xs text-gray-500">{version && `v${version}`}</span>
          <div
            className="pointer-events-none absolute bottom-5 left-0 z-50 min-w-max rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          >
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              버전 정보
            </div>
            <table className="text-xs">
              <tbody>
                {[
                  ['FOSSLight Scanner GUI', version],
                  ['FOSSLight Scanner', scannerVersions?.fosslight_scanner],
                  ['FOSSLight Source Scanner', scannerVersions?.fosslight_source],
                  ['FOSSLight Dependency Scanner', scannerVersions?.fosslight_dependency],
                  ['FOSSLight Binary Scanner', scannerVersions?.fosslight_binary]
                ].map(([label, ver]) => (
                  <tr key={label}>
                    <td className="pr-4 text-gray-400">{label}</td>
                    <td className="text-gray-200">{formatVersion(ver)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <button
          onClick={() => void window.api.openExternal(GITHUB_ISSUES_URL)}
          title="FOSSLight GitHub — 이슈 리포팅"
          className="text-gray-500 transition-colors hover:text-gray-200"
        >
          <GithubIcon />
        </button>
      </div>
    </aside>
  )
}
