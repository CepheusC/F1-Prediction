import { useMemo } from 'react'
import { format } from 'date-fns'
import { Loader2, Save } from 'lucide-react'
import type { AdminDriver } from '@/utils/types'

type Positions = [string, string, string, string, string]

export default function ResultEditor({
  eventId,
  locked,
  drivers,
  positions,
  setPositions,
  saving,
  savedAt,
  canFinalize,
  onSave,
  onFinalize,
}: {
  eventId: string
  locked: boolean
  drivers: AdminDriver[]
  positions: Positions
  setPositions: (updater: (prev: Positions) => Positions) => void
  saving: boolean
  savedAt: string | null
  canFinalize: boolean
  onSave: () => void
  onFinalize: () => void
}) {
  const selectedSet = useMemo(() => new Set(positions.filter(Boolean)), [positions])
  const duplicates = useMemo(() => {
    const seen = new Set<string>()
    for (const p of positions) {
      if (!p) continue
      if (seen.has(p)) return true
      seen.add(p)
    }
    return false
  }, [positions])
  const complete = positions.every(Boolean)

  const updatePos = (idx: number, value: string) => {
    setPositions((prev) => {
      const next = [...prev] as Positions
      next[idx] = value
      return next
    })
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-3">
        <div className="text-sm font-medium text-zinc-900">录入前五名</div>
        <div className="mt-1 text-xs text-zinc-500">同一位车手不能出现在多个位置</div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {([1, 2, 3, 4, 5] as const).map((pos, idx) => (
          <label key={pos} className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">P{pos}</div>
            <select
              value={positions[idx]}
              disabled={!eventId || locked}
              onChange={(e) => updatePos(idx, e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
            >
              <option value="">请选择车手</option>
              {drivers.map((d) => {
                const selectedSomewhereElse = selectedSet.has(d.id) && positions[idx] !== d.id
                return (
                  <option key={d.id} value={d.id} disabled={selectedSomewhereElse}>
                    {d.name}{d.team ? ` · ${d.team}` : ''}{d.is_active ? '' : '（停用）'}
                  </option>
                )
              })}
            </select>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
        <div className="text-xs text-zinc-600">
          {duplicates ? <span className="text-red-700">存在重复车手</span> : <span>无重复</span>}
          {!complete ? <span className="ml-2 text-zinc-500">（还未选满 5 位）</span> : null}
          {savedAt ? <span className="ml-2 text-zinc-500">已保存：{format(new Date(savedAt), 'HH:mm:ss')}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!eventId || locked || saving || !complete || duplicates}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存结果
          </button>
          <button
            type="button"
            onClick={onFinalize}
            disabled={!eventId || saving || !canFinalize}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            finalize
          </button>
        </div>
      </div>
    </div>
  )
}

