import { useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Power, RefreshCw } from 'lucide-react'
import { useAdminDrivers } from '@/hooks/admin/useAdminDrivers'
import { apiFetch } from '@/utils/api'
import type { AdminDriver } from '@/utils/types'
import DriverFormModal from '@/pages/admin/DriverFormModal'
import { toDraft, type DriverDraft } from '@/pages/admin/driverDraft'

export default function AdminDrivers() {
  const { drivers, setDrivers, loading, error, reload } = useAdminDrivers()
  const [q, setQ] = useState('')
  const [showInactive, setShowInactive] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [editTarget, setEditTarget] = useState<AdminDriver | null>(null)
  const [draft, setDraft] = useState<DriverDraft>(() => toDraft(null))

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return drivers
      .filter((d) => (showInactive ? true : d.is_active))
      .filter((d) => {
        if (!query) return true
        return (
          d.name.toLowerCase().includes(query) ||
          (d.team ?? '').toLowerCase().includes(query) ||
          d.id.toLowerCase().includes(query)
        )
      })
  }, [drivers, q, showInactive])

  const openCreate = () => {
    setActionError(null)
    setDraft(toDraft(null))
    setCreateOpen(true)
  }

  const openEdit = (d: AdminDriver) => {
    setActionError(null)
    setEditTarget(d)
    setDraft(toDraft(d))
    setEditOpen(true)
  }

  const create = async () => {
    setActionError(null)
    setSaving(true)
    try {
      const res = await apiFetch<{ driver: AdminDriver }>('/admin/drivers', {
        method: 'POST',
        json: {
          name: draft.name.trim(),
          team: draft.team.trim() ? draft.team.trim() : undefined,
          is_active: draft.is_active,
        },
      })
      setDrivers((prev) => [res.driver, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
      setCreateOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  const update = async () => {
    if (!editTarget) return
    setActionError(null)
    setSaving(true)
    try {
      const res = await apiFetch<{ driver: AdminDriver }>(`/admin/drivers/${encodeURIComponent(editTarget.id)}`,
        {
          method: 'PATCH',
          json: {
            name: draft.name.trim(),
            team: draft.team.trim() ? draft.team.trim() : null,
            is_active: draft.is_active,
          },
        },
      )
      setDrivers((prev) => prev.map((d) => (d.id === res.driver.id ? res.driver : d)))
      setEditOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (d: AdminDriver) => {
    setActionError(null)
    setSaving(true)
    try {
      const res = await apiFetch<{ driver: AdminDriver }>(`/admin/drivers/${encodeURIComponent(d.id)}`,
        {
          method: 'PATCH',
          json: { is_active: !d.is_active },
        },
      )
      setDrivers((prev) => prev.map((x) => (x.id === d.id ? res.driver : x)))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">车手管理</div>
            <div className="mt-1 text-xl font-semibold text-zinc-900">新增 / 编辑 / 启用停用</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              新增
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索 name/team/id"
            className="w-full max-w-xs rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            显示停用
          </label>
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-5 py-3 font-medium text-zinc-600">Name</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Team</th>
                <th className="px-5 py-3 font-medium text-zinc-600">状态</th>
                <th className="px-5 py-3 font-medium text-zinc-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-zinc-500" colSpan={4}>
                    暂无数据
                  </td>
                </tr>
              ) : null}

              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-900">{d.name}</td>
                  <td className="px-5 py-3 text-zinc-700">{d.team ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        d.is_active
                          ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                          : 'rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700'
                      }
                    >
                      {d.is_active ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(d)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Power className="h-3.5 w-3.5" />
                        {d.is_active ? '停用' : '启用'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DriverFormModal
        open={createOpen}
        title="新增车手"
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        error={actionError}
        onClose={() => setCreateOpen(false)}
        onSubmit={() => void create()}
      />

      <DriverFormModal
        open={editOpen}
        title="编辑车手"
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        error={actionError}
        onClose={() => setEditOpen(false)}
        onSubmit={() => void update()}
      />
    </div>
  )
}
