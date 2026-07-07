import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import OverviewPage from './pages/OverviewPage'
import ScanPage from './pages/ScanPage'
import ResultsPage from './pages/ResultsPage'
import LicenseRiskPage from './pages/LicenseRiskPage'
// import VulnerabilityPage from './pages/VulnerabilityPage'
import { useAppStore } from './store/appStore'

export default function App(): React.JSX.Element {
  const handleScanEvent = useAppStore((s) => s.handleScanEvent)
  const setReport = useAppStore((s) => s.setReport)
  const setRecentScans = useAppStore((s) => s.setRecentScans)

  useEffect(() => {
    // 앱 시작 시 최근 스캔 결과 자동 로드
    void window.api.getRecentScans().then(setRecentScans)
    void window.api.loadReport().then((r) => {
      if (r) setReport(r)
    })
    return window.api.onScanEvent(handleScanEvent)
  }, [handleScanEvent, setReport, setRecentScans])

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
    </div>
  )
}
