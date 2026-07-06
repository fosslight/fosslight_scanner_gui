interface Props {
  label: string
  value: number | string
  hint?: string
  onClick?: () => void
}

export default function StatCard({ label, value, hint, onClick }: Props): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm ${
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : 'cursor-default'
      }`}
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </button>
  )
}
