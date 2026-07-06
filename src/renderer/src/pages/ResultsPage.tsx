import { useParams } from 'react-router-dom'
import DataTable from '../components/DataTable'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'

const SCANNER_META: Record<string, { title: string; description: string; pathHeader: string }> = {
  source: {
    title: 'Source 분석 결과',
    description: '소스 코드에서 검출된 오픈소스 및 라이선스 정보입니다.',
    pathHeader: 'Source Path'
  },
  dependency: {
    title: 'Dependency 분석 결과',
    description: '패키지 매니저 manifest에서 분석된 의존성 정보입니다.',
    pathHeader: 'Package URL'
  },
  binary: {
    title: 'Binary 분석 결과',
    description: '바이너리 파일에서 검출된 오픈소스 정보입니다.',
    pathHeader: 'Binary Path'
  }
}

export default function ResultsPage(): React.JSX.Element {
  const { scanner } = useParams<{ scanner: 'source' | 'dependency' | 'binary' }>()
  const report = useAppStore((s) => s.report)

  const meta = SCANNER_META[scanner ?? 'source']
  const items = report?.items[scanner ?? 'source'] ?? []

  if (!report) return <EmptyState />

  return (
    <div className="p-8">
      <PageHeader title={meta.title} description={meta.description} />
      <DataTable key={scanner} items={items} pathHeader={meta.pathHeader} />
    </div>
  )
}
