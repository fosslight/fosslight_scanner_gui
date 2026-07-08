import { useEffect, useState } from 'react'
import { List, type RowComponentProps, useListCallbackRef } from 'react-window'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import type { GitRefValidationResult, GuiResult, ScanMode, ScanTargetType } from '@shared/types'

const LOG_ROW_HEIGHT = 24

const PHASES = [
  { key: 'installing', label: '도구 설치' },
  { key: 'starting', label: '준비' },
  { key: 'scanning', label: '분석' },
  { key: 'normalizing', label: '결과 정리' }
]

const MODE_LABEL: Record<ScanMode, string> = {
  source: 'Source Code',
  dependency: 'Dependency',
  binary: 'Binary'
}

const TARGET_TYPE_LABEL: Record<ScanTargetType, string> = {
  folder: '폴더',
  archive: '압축파일',
  url: 'URL'
}

const ARCHIVE_EXTENSIONS = ['.tar.bz2', '.tar.gz', '.tar.xz', '.tgz', '.tar', '.zip', '.jar', '.bz2', '.whl', '.src.rpm', '.rpm']

function isGitRepoUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (!/^(https?:\/\/|git@|git:\/\/|ssh:\/\/)/i.test(trimmed)) return false
  const lower = trimmed.toLowerCase().split('?')[0]
  return !ARCHIVE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

interface LogRowProps {
  lines: string[]
}

function LogRow({ index, style, lines }: RowComponentProps<LogRowProps>): React.JSX.Element {
  const line = lines[index]
  return (
    <div
      style={style}
      className={`overflow-hidden whitespace-nowrap ${line.startsWith('[ERROR]') ? 'text-red-400' : ''}`}
    >
      {line}
    </div>
  )
}

function PhaseStepper({ current }: { current: string }): React.JSX.Element {
  const currentIdx = PHASES.findIndex((p) => p.key === current)
  return (
    <div className="flex items-center gap-2">
      {PHASES.map((p, i) => (
        <div key={p.key} className="flex items-center gap-2">
          {i > 0 && <div className="h-px w-8 bg-gray-300" />}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              i < currentIdx
                ? 'bg-emerald-100 text-emerald-700'
                : i === currentIdx
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            {i === currentIdx && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            )}
            {p.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function LogConsole({ lines }: { lines: string[] }): React.JSX.Element {
  const [listApi, listRef] = useListCallbackRef()

  useEffect(() => {
    if (lines.length > 0) {
      listApi?.scrollToRow({ index: lines.length - 1, align: 'end' })
    }
  }, [lines, listApi])

  return (
    <div className="min-h-0 flex-1 rounded-lg bg-gray-900 p-3 font-mono text-xs leading-tight text-gray-300">
      <List
        listRef={listRef}
        rowComponent={LogRow}
        rowCount={lines.length}
        rowHeight={LOG_ROW_HEIGHT}
        rowProps={{ lines }}
        style={{ height: '100%' }}
      />
    </div>
  )
}

function DotSpinner(): React.JSX.Element {
  return (
    <span className="relative mr-1.5 inline-flex h-3.5 w-3.5 animate-spin">
      <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gray-500" />
      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gray-400" />
      <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gray-300" />
      <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gray-400" />
    </span>
  )
}

function FieldLabel({
  title,
  required = false
}: {
  title: string
  required?: boolean
}): React.JSX.Element {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-800">{title}</span>
      {required && (
        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          필수
        </span>
      )}
    </div>
  )
}

function createEmptyReport(target: string, modes: ScanMode[]): GuiResult {
  return {
    scanDate: new Date().toISOString().slice(0, 19),
    analyzedPath: target,
    modes: modes.length === 3 ? ['all'] : modes,
    toolInfo: {},
    items: {
      source: [],
      dependency: [],
      binary: []
    }
  }
}

export default function ScanPage(): React.JSX.Element {
  const {
    form,
    setForm,
    scanStatus,
    scanPhase,
    logLines,
    warnings,
    errorMessage,
    report,
    lastResultFile,
    startScan,
    markCancelled,
    setReport,
    setRecentScans
  } = useAppStore()
  const [excludeInput, setExcludeInput] = useState('')
  const [gitRefValidation, setGitRefValidation] = useState<GitRefValidationResult | null>(null)
  const [validatingGitRef, setValidatingGitRef] = useState(false)
  const running = scanStatus === 'running'
  const gitUrlTarget = form.targetType === 'url' && isGitRepoUrl(form.target)
  const hasGitRefInput = form.gitRef.trim() !== ''
  const gitRefInvalid = gitUrlTarget && hasGitRefInput && gitRefValidation?.valid === false
  const hasRefSuggestions = (gitRefValidation?.suggestions?.length ?? 0) > 0

  // 스캔 성공 시 결과 자동 로드
  useEffect(() => {
    if (scanStatus === 'success') {
      if (report) {
        void window.api.getRecentScans().then(setRecentScans)
        return
      }
      if (lastResultFile) {
        void window.api.loadReport(lastResultFile).then((r) => {
          setReport(r)
        })
      } else {
        setReport(createEmptyReport(form.target.trim(), form.modes))
      }
      void window.api.getRecentScans().then(setRecentScans)
    }
  }, [scanStatus, report, lastResultFile, form.target, form.modes, setReport, setRecentScans])

  const toggleMode = (m: ScanMode): void => {
    const has = form.modes.includes(m)
    if (has && form.modes.length === 1) return // 최소 1개 유지
    setForm({ modes: has ? form.modes.filter((x) => x !== m) : [...form.modes, m] })
  }

  const pickOutputDir = async (): Promise<void> => {
    const dir = await window.api.selectDirectory()
    if (dir) setForm({ outputDir: dir })
  }

  const pickTarget = async (): Promise<void> => {
    const picked =
      form.targetType === 'archive'
        ? await window.api.selectArchive()
        : await window.api.selectDirectory()
    if (!picked) return
    // 리포트 저장 위치 기본값: 폴더는 그 폴더, 압축파일은 파일이 있는 폴더
    const defaultOutput =
      form.targetType === 'archive' ? picked.slice(0, picked.lastIndexOf('\\')) : picked
    setForm({ target: picked, outputDir: defaultOutput })
  }

  const changeTargetType = (t: ScanTargetType): void => {
    if (t !== form.targetType) {
      setForm({ targetType: t, target: '', gitRef: '', gitRefType: null })
      setGitRefValidation(null)
    }
  }

  const targetValid =
    form.targetType === 'url' ? /^(https?:\/\/|git@)/.test(form.target.trim()) : form.target !== ''

  const addExclude = (): void => {
    const v = excludeInput.trim()
    if (v && !form.excludePaths.includes(v)) {
      setForm({ excludePaths: [...form.excludePaths, v] })
    }
    setExcludeInput('')
  }

  const onStart = async (): Promise<void> => {
    if (!targetValid || !form.outputDir) return

    const nextCfg = {
      targetType: form.targetType,
      target: form.target.trim(),
      modes: form.modes,
      excludePaths: form.excludePaths,
      outputDir: form.outputDir,
      gitRef: undefined as string | undefined,
      gitRefType: null as 'branch' | 'tag' | null
    }

    if (gitUrlTarget && hasGitRefInput) {
      let validation = gitRefValidation
      if (!validation || validation.resolvedRef !== form.gitRef.trim()) {
        validation = await onBlurGitRef()
      }

      if (!validation?.valid) {
        useAppStore.setState({
          scanStatus: 'error',
          errorMessage: '입력한 Branch/Tag가 유효하지 않습니다. 포커스 아웃 후 검증 상태를 확인해 주세요.'
        })
        return
      }
      nextCfg.gitRef = validation.resolvedRef ?? form.gitRef.trim()
      nextCfg.gitRefType = validation.refType
    }

    startScan()
    const res = await window.api.startScan(nextCfg)
    if (!res.ok) {
      useAppStore.setState({
        scanStatus: 'error',
        errorMessage: res.message ?? '스캔을 시작할 수 없습니다'
      })
    }
  }

  const onCancel = async (): Promise<void> => {
    if (window.confirm('진행 중인 스캔을 취소하시겠습니까?')) {
      markCancelled()
      await window.api.cancelScan()
    }
  }

  const onBlurGitRef = async (): Promise<GitRefValidationResult | null> => {
    const url = form.target.trim()
    const ref = form.gitRef.trim()
    if (!gitUrlTarget || !ref) {
      setGitRefValidation(null)
      return null
    }
    setValidatingGitRef(true)
    try {
      const result = await window.api.validateGitRef(url, ref)
      setGitRefValidation(result)
      setForm({ gitRefType: result.refType })
      return result
    } finally {
      setValidatingGitRef(false)
    }
  }

  useEffect(() => {
    setGitRefValidation(null)
    if (!gitUrlTarget) {
      setForm({ gitRefType: null })
    }
  }, [form.target, form.targetType])

  const renderGitRefBadge = (): React.JSX.Element | null => {
    if (!gitUrlTarget || !hasGitRefInput) return null
    if (validatingGitRef) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          <DotSpinner />
          검증 중...
        </span>
      )
    }
    if (!gitRefValidation) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          포커스 아웃 시 검증
        </span>
      )
    }
    if (gitRefValidation.valid) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
          유효함 ({gitRefValidation.refType === 'tag' ? 'Tag' : 'Branch'}: {gitRefValidation.resolvedRef ?? form.gitRef.trim()})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        유효하지 않음: {gitRefValidation.message}
      </span>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-8">
      <PageHeader
        title="New Scan"
        description="FOSSLight Scanner를 통해 오픈 소스 분석을 실행합니다."
      />

      {warnings.map((w, i) => (
        <div
          key={i}
          className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
        >
          ⚠️ {w}
        </div>
      ))}

      {!running && (
        <div className="w-full space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <FieldLabel title="분석 대상" required />
            <div className="mb-2 inline-flex rounded-lg border border-gray-300 p-0.5">
              {(Object.keys(TARGET_TYPE_LABEL) as ScanTargetType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => changeTargetType(t)}
                  className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                    form.targetType === t
                      ? 'bg-accent font-medium text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {TARGET_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            {form.targetType === 'url' ? (
              <>
                <input
                  value={form.target}
                  onChange={(e) => setForm({ target: e.target.value, gitRefType: null })}
                  placeholder="예: https://github.com/fosslight/fosslight_scanner 또는 압축파일 다운로드 URL"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <div className="mt-1 text-xs text-gray-400">
                  git 저장소 URL 분석은 시스템에 git이 설치되어 있어야 합니다.
                </div>
                {gitUrlTarget && (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Branch 또는 Tag (선택)
                    </label>
                    <input
                      value={form.gitRef}
                      onChange={(e) => {
                        setForm({ gitRef: e.target.value, gitRefType: null })
                        setGitRefValidation(null)
                      }}
                      onBlur={() => void onBlurGitRef()}
                      placeholder="예: main 또는 v2.1.25"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <div className="mt-2">{renderGitRefBadge()}</div>
                    {gitRefValidation && !gitRefValidation.valid && hasRefSuggestions && (
                      <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Warning: 유사한 Branch/Tag 후보 - {gitRefValidation.suggestions?.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <input
                  value={form.target}
                  readOnly
                  placeholder={
                    form.targetType === 'folder'
                      ? '분석할 폴더를 선택하세요'
                      : '분석할 압축파일을 선택하세요 (zip, tar.gz, jar 등)'
                  }
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => void pickTarget()}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {form.targetType === 'folder' ? '폴더 선택' : '파일 선택'}
                </button>
              </div>
            )}
          </div>

          <div>
            <FieldLabel title="분석 유형" />
            <div className="flex gap-4">
              {(Object.keys(MODE_LABEL) as ScanMode[]).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.modes.includes(m)}
                    onChange={() => toggleMode(m)}
                    className="h-4 w-4 accent-accent"
                  />
                  {MODE_LABEL[m]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel title="제외 경로" />
            <div className="flex gap-2">
              <input
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExclude()}
                placeholder="예: node_modules (Enter로 추가)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={addExclude}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
              >
                추가
              </button>
            </div>
            {form.excludePaths.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.excludePaths.map((p) => (
                  <span
                    key={p}
                    className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                  >
                    {p}
                    <button
                      onClick={() =>
                        setForm({ excludePaths: form.excludePaths.filter((x) => x !== p) })
                      }
                      className="text-gray-400 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <FieldLabel title="리포트 저장 위치" required />
            <div className="flex gap-2">
              <input
                value={form.outputDir}
                readOnly
                placeholder="리포트를 저장할 폴더를 선택하세요"
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <button
                onClick={() => void pickOutputDir()}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
              >
                폴더 선택
              </button>
            </div>
          </div>

          {scanStatus === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {scanStatus === 'cancelled' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
              스캔이 취소되었습니다.
            </div>
          )}

          <button
            onClick={() => void onStart()}
            disabled={!targetValid || !form.outputDir || validatingGitRef || gitRefInvalid}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            스캔 시작
          </button>
        </div>
      )}

      {running && (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <PhaseStepper current={scanPhase} />
            <button
              onClick={() => void onCancel()}
              className="rounded-lg border border-red-300 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              취소
            </button>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-accent" />
          </div>
          <div className="text-xs text-gray-500">
            분석 대상 크기에 따라 수 분에서 수십 분이 걸릴 수 있습니다.
          </div>
          <LogConsole lines={logLines} />
        </div>
      )}
    </div>
  )
}
