import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import OverviewPage from './pages/OverviewPage'
import ScanPage from './pages/ScanPage'
import ResultsPage from './pages/ResultsPage'
import LicenseRiskPage from './pages/LicenseRiskPage'
// import VulnerabilityPage from './pages/VulnerabilityPage'
import { useAppStore } from './store/appStore'

export default function App(): React.JSX.Element {
  const location = useLocation()
  const handleScanEvent = useAppStore((s) => s.handleScanEvent)
  const setReport = useAppStore((s) => s.setReport)
  const setRecentScans = useAppStore((s) => s.setRecentScans)
  const toast = useAppStore((s) => s.toast)
  const clearToast = useAppStore((s) => s.clearToast)
  const overviewHasNew = useAppStore((s) => s.overviewHasNew)
  const clearOverviewNew = useAppStore((s) => s.clearOverviewNew)
  const prevPathname = useRef(location.pathname)

  useEffect(() => {
    // 앱 시작 시 최근 스캔 결과 자동 로드
    void window.api.getRecentScans().then(setRecentScans)
    void window.api.loadReport().then((r) => {
      if (r) setReport(r)
    })
    return window.api.onScanEvent(handleScanEvent)
  }, [handleScanEvent, setReport, setRecentScans])

  useEffect(() => {
    const movedToAnotherPage = prevPathname.current !== location.pathname
    if (toast && movedToAnotherPage) {
      clearToast()
    }
    prevPathname.current = location.pathname
  }, [location.pathname, toast, clearToast])

  useEffect(() => {
    if (location.pathname === '/' && overviewHasNew) {
      clearOverviewNew()
    }
  }, [location.pathname, overviewHasNew, clearOverviewNew])

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/results/:scanner" element={<ResultsPage />} />
          <Route path="/risk/license" element={<LicenseRiskPage />} />
          {/*
            Vulnerability 기능은 현재 미완성 상태로 사용자 노출을 숨깁니다.
            추후 재활성화 시 아래 Route를 복구하세요.
            <Route path="/risk/vulnerability" element={<VulnerabilityPage />} />
          */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 max-w-md rounded-xl px-4 py-3 text-sm shadow-lg ${
            toast.tone === 'success'
              ? 'border border-emerald-600 bg-emerald-600 text-white'
              : 'border border-red-600 bg-red-600 text-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="font-semibold">{toast.tone === 'success' ? '완료' : '실패'}</div>
            <button
              onClick={clearToast}
              className="-mr-1 rounded p-1 text-white/90 hover:bg-white/20"
              aria-label="토스트 닫기"
            >
              ✕
            </button>
          </div>
          <div className="mt-1">{toast.message}</div>
        </div>
      )}
    </div>
  )
}
