import { useMemo, useState } from 'react'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { useAdminSeasons } from '@/hooks/admin/useAdminSeasons'
import { apiFetch } from '@/utils/api'
import type { Season } from '@/utils/types'

export default function AdminSeasons() {
  const { seasons, setSeasons, loading, error, reload } = useAdminSeasons()
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const canCreate = useMemo(() => {
    const n = Number(year)
    return Number.isFinite(n) && n >= 1950 && n <= 2100
  }, [year])

  const create = async () => {
    setActionError(null)
    setSaving(true)
    try {
      const res = await apiFetch<{ season: Season }>('/admin/seasons', {
        method: 'POST',
        json: { year: Number(year) },
      })
      setSeasons((prev) => [res.season, ...prev].sort((a, b) => b.year - a.year))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">赛季</div>
            <div className="mt-1 text-xl font-semibold text-zinc-900">创建赛季</div>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Year</div>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              className="w-40 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              placeholder="2026"
            />
          </label>
          <button
            type="button"
            onClick={() => void create()}
            disabled={!canCreate || saving}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            创建
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {actionError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载…
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-3">
          <div className="text-sm font-medium text-zinc-900">赛季列表</div>
        </div>
        <div className="divide-y divide-zinc-100">
          {seasons.length === 0 && !loading ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-500">暂无赛季</div>
          ) : null}
          {seasons.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="text-sm font-medium text-zinc-900">{s.year}</div>
              <div className="text-xs text-zinc-500">{s.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

