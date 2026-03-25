import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { useAdminSeasons } from '@/hooks/admin/useAdminSeasons'
import { useAdminEvents } from '@/hooks/admin/useAdminEvents'
import { apiFetch } from '@/utils/api'
import type { RaceEvent, Season } from '@/utils/types'
import { toIsoFromLocalInput } from '@/utils/datetime'

type SessionType = 'Quali' | 'Race' | 'Sprint' | 'Sprint Quali'

export default function AdminEvents() {
  const { seasons, loading: seasonsLoading, error: seasonsError, reload: reloadSeasons } = useAdminSeasons()
  const defaultSeasonId = seasons[0]?.id ?? null
  const [seasonId, setSeasonId] = useState<string | null>(defaultSeasonId)

  useEffect(() => {
    if (!seasonId && defaultSeasonId) setSeasonId(defaultSeasonId)
  }, [seasonId, defaultSeasonId])

  const resolvedSeasonId = seasonId ?? defaultSeasonId
  const { events, setEvents, loading, error, reload } = useAdminEvents(resolvedSeasonId)

  const [round, setRound] = useState('')
  const [grandPrixName, setGrandPrixName] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('Race')
  const [eventDate, setEventDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const seasonById = useMemo(() => new Map(seasons.map((s) => [s.id, s])), [seasons])
  const selectedSeason: Season | null = resolvedSeasonId ? seasonById.get(resolvedSeasonId) ?? null : null

  const canCreate = useMemo(() => {
    if (!resolvedSeasonId) return false
    const r = Number(round)
    if (!Number.isFinite(r) || r < 1) return false
    if (!grandPrixName.trim()) return false
    if (!eventDate || !deadline) return false
    return true
  }, [resolvedSeasonId, round, grandPrixName, eventDate, deadline])

  const create = async () => {
    if (!resolvedSeasonId) return
    setActionError(null)
    setSaving(true)
    try {
      const res = await apiFetch<{ event: RaceEvent }>('/admin/events', {
        method: 'POST',
        json: {
          season_id: resolvedSeasonId,
          round: Number(round),
          grand_prix_name: grandPrixName.trim(),
          session_type: sessionType,
          event_date: toIsoFromLocalInput(eventDate),
          prediction_deadline: toIsoFromLocalInput(deadline),
        },
      })
      setEvents((prev) => [...prev, res.event])
      setRound('')
      setGrandPrixName('')
      setSessionType('Race')
      setEventDate('')
      setDeadline('')
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
            <div className="text-sm text-zinc-600">比赛 / Session</div>
            <div className="mt-1 text-xl font-semibold text-zinc-900">创建比赛（按赛季）</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void reloadSeasons()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" />
              刷新赛季
            </button>
            <button
              type="button"
              onClick={() => void reload()}
              disabled={!resolvedSeasonId}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              刷新比赛
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">赛季</div>
            <select
              value={resolvedSeasonId ?? ''}
              onChange={(e) => setSeasonId(e.target.value || null)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="" disabled>
                请选择赛季
              </option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.year}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {selectedSeason ? `当前：${selectedSeason.year}` : '请先创建赛季并选择'}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Round</div>
            <input
              value={round}
              onChange={(e) => setRound(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              placeholder="1"
            />
          </label>
          <label className="block md:col-span-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">Grand Prix</div>
            <input
              value={grandPrixName}
              onChange={(e) => setGrandPrixName(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              placeholder="Australian Grand Prix"
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Session Type</div>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="Race">Race</option>
              <option value="Quali">Quali</option>
              <option value="Sprint">Sprint</option>
              <option value="Sprint Quali">Sprint Quali</option>
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Event Date</div>
            <input
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              type="datetime-local"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">Prediction Deadline</div>
            <input
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              type="datetime-local"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void create()}
            disabled={!canCreate || saving}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            创建比赛
          </button>
        </div>

        {seasonsError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{seasonsError}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {actionError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}
        {(seasonsLoading || loading) && !seasonsError ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载…
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
          <div className="text-sm font-medium text-zinc-900">本赛季比赛列表</div>
          <div className="text-xs text-zinc-500">{selectedSeason ? `${selectedSeason.year}` : '—'}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-5 py-3 font-medium text-zinc-600">Round</th>
                <th className="px-5 py-3 font-medium text-zinc-600">GP</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Session</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Event Date</th>
                <th className="px-5 py-3 font-medium text-zinc-600">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {events.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-500">
                    暂无比赛
                  </td>
                </tr>
              ) : null}
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-900">{e.round}</td>
                  <td className="px-5 py-3 text-zinc-700">{e.grand_prix_name}</td>
                  <td className="px-5 py-3 text-zinc-700">{e.session_type}</td>
                  <td className="px-5 py-3 text-zinc-700">
                    {e.event_date ? format(new Date(e.event_date), 'yyyy-MM-dd HH:mm') : '—'}
                  </td>
                  <td className="px-5 py-3 text-zinc-700">
                    {e.prediction_deadline ? format(new Date(e.prediction_deadline), 'yyyy-MM-dd HH:mm') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500">
          创建时会把输入的本地时间转换为 ISO（UTC）保存；展示时按本机时区显示。
        </div>
      </div>
    </div>
  )
}

