import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import type { ScanMode, ScanTargetType } from '@shared/types'

const PHASES = [
  { key: 'installing', label: '도구 설치' },
  { key: 'starting', label: '준비' },
  { key: 'scanning', label: '분석' },
  { key: 'normalizing', label: '결과 정리' }
]

const MODE_LABEL: Record<ScanMode, string> = {
  source: '소스 코드',
  dependency: '의존성',
  binary: '바이너리'
}

const TARGET_TYPE_LABEL: Record<ScanTargetType, string> = {
  folder: '폴더',
  archive: '압축파일',
  url: 'URL'
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
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight })
  }, [lines])
  return (
    <div
      ref={ref}
      className="h-64 overflow-y-auto rounded-lg bg-gray-900 p-3 font-mono text-xs leading-relaxed text-gray-300"
    >
      {lines.map((l, i) => (
        <div key={i} className={l.startsWith('[ERROR]') ? 'text-red-400' : ''}>
          {l}
        </div>
      ))}
    </div>
  )
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
    startScan,
    markCancelled,
    setReport,
    setRecentScans
  } = useAppStore()
  const [excludeInput, setExcludeInput] = useState('')
  const running = scanStatus === 'running'

  // 스캔 성공 시 결과 자동 로드
  useEffect(() => {
    if (scanStatus === 'success') {
      void window.api.loadReport().then((r) => {
        if (r) setReport(r)
      })
      void window.api.getRecentScans().then(setRecentScans)
    }
  }, [scanStatus, setReport, setRecentScans])

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
    if (t !== form.targetType) setForm({ targetType: t, target: '' })
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
    startScan()
    const res = await window.api.startScan({
      targetType: form.targetType,
      target: form.target.trim(),
      modes: form.modes,
      excludePaths: form.excludePaths,
      outputDir: form.outputDir
    })
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

  return (
    <div className="p-8">
      <PageHeader
        title="스캔 실행"
        description="분석할 폴더를 선택하고 FOSSLight Scanner 분석을 실행합니다."
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
        <div className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">분석 대상 *</label>
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
                  onChange={(e) => setForm({ target: e.target.value })}
                  placeholder="예: https://github.com/fosslight/fosslight_scanner 또는 압축파일 다운로드 URL"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <div className="mt-1 text-xs text-gray-400">
                  git 저장소 URL 분석은 시스템에 git이 설치되어 있어야 합니다.
                </div>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">분석 유형</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">제외 경로</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              리포트 저장 위치 *
            </label>
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
          {scanStatus === 'success' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              ✅ 스캔이 완료되었습니다. Overview에서 결과를 확인하세요.
            </div>
          )}
          {scanStatus === 'cancelled' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
              스캔이 취소되었습니다.
            </div>
          )}

          <button
            onClick={() => void onStart()}
            disabled={!targetValid || !form.outputDir}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            스캔 시작
          </button>
        </div>
      )}

      {running && (
        <div className="max-w-3xl space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
