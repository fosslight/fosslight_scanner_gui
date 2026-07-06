import { Fragment, useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table'
import type { OssItem } from '@shared/types'
import { ExcludeBadge } from './Badge'

interface Props {
  items: OssItem[]
  pathHeader: string // "Source Path" | "Binary Path" | "Package URL"
}

function LicenseChips({ licenses }: { licenses: string[] }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1">
      {licenses.map((l) => (
        <span key={l} className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">
          {l}
        </span>
      ))}
    </div>
  )
}

export default function DataTable({ items, pathHeader }: Props): React.JSX.Element {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  const columns = useMemo<ColumnDef<OssItem>[]>(
    () => [
      {
        id: 'path',
        header: pathHeader,
        accessorFn: (row) => row.paths.join(', '),
        cell: (info) => <span className="break-all text-gray-700">{info.getValue<string>()}</span>
      },
      { header: 'OSS 이름', accessorKey: 'name' },
      { header: '버전', accessorKey: 'version' },
      {
        id: 'license',
        header: '라이선스',
        accessorFn: (row) => row.license.join(', '),
        cell: (info) => <LicenseChips licenses={info.row.original.license} />
      },
      {
        id: 'exclude',
        header: '',
        accessorFn: (row) => row.exclude,
        enableSorting: false,
        cell: (info) => (info.getValue<boolean>() ? <ExcludeBadge /> : null)
      }
    ],
    [pathHeader]
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } }
  })

  return (
    <div>
      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="경로, OSS 이름, 라이선스 검색..."
        className="mb-3 w-72 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-accent"
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className={`px-4 py-2.5 text-left font-semibold text-gray-600 select-none ${
                      h.column.getCanSort() ? 'cursor-pointer hover:text-gray-900' : ''
                    }`}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const item = row.original
              const idx = row.index
              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                    className={`cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                      item.exclude ? 'opacity-45' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expanded === idx && (
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td colSpan={columns.length} className="px-6 py-3 text-xs text-gray-600">
                        <dl className="grid grid-cols-[100px_1fr] gap-y-1">
                          <dt className="font-medium">Download</dt>
                          <dd className="break-all">{item.downloadLocation || '-'}</dd>
                          <dt className="font-medium">Homepage</dt>
                          <dd className="break-all">{item.homepage || '-'}</dd>
                          <dt className="font-medium">Copyright</dt>
                          <dd className="whitespace-pre-wrap">{item.copyright || '-'}</dd>
                          <dt className="font-medium">Comment</dt>
                          <dd>{item.comment || '-'}</dd>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  표시할 항목이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border border-gray-300 bg-white px-2 py-1 disabled:opacity-40"
          >
            이전
          </button>
          <span>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 페이지
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border border-gray-300 bg-white px-2 py-1 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
