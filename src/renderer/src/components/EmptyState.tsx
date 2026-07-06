import { useNavigate } from 'react-router-dom'

export default function EmptyState(): React.JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-4xl">📂</div>
      <div>
        <div className="text-lg font-semibold text-gray-700">스캔 결과가 없습니다</div>
        <div className="mt-1 text-sm text-gray-500">
          분석할 폴더를 선택하고 스캔을 실행해주세요.
        </div>
      </div>
      <button
        onClick={() => navigate('/scan')}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        스캔 실행하기
      </button>
    </div>
  )
}
