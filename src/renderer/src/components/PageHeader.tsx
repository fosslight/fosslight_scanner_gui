interface Props {
  title: string
  description?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, description, children }: Props): React.JSX.Element {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}
