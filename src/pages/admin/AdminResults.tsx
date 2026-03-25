import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Loader2, Lock, RefreshCw } from 'lucide-react'
import { useAdminSeasons } from '@/hooks/admin/useAdminSeasons'
import { useAdminEvents } from '@/hooks/admin/useAdminEvents'
import { useAdminDrivers } from '@/hooks/admin/useAdminDrivers'
import { apiFetch } from '@/utils/api'
import type { RaceEvent, RaceResult, Season } from '@/utils/types'
import ResultEditor from '@/pages/admin/ResultEditor'

type Positions = [string, string, string, string, string]

function toPositions(r: RaceResult): Positions {
  return [
    r.position_1_driver_id,
    r.position_2_driver_id,
    r.position_3_driver_id,
    r.position_4_driver_id,
    r.position_5_driver_id,
  ]
}

export default function AdminResults() {
  const { seasons, loading: seasonsLoading, error: seasonsError, reload: reloadSeasons } = useAdminSeasons()
  const defaultSeasonId = seasons[0]?.id ?? null
  const [seasonId, setSeasonId] = useState<string | null>(defaultSeasonId)

  const resolvedSeasonId = seasonId ?? defaultSeasonId
  const { events, loading: eventsLoading, error: eventsError, reload: reloadEvents } = useAdminEvents(resolvedSeasonId)
  const { drivers, loading: driversLoading, error: driversError, reload: reloadDrivers } = useAdminDrivers()

  const [eventId, setEventId] = useState<string>('')
  const [result, setResult] = useState<RaceResult | null>(null)
  const [positions, setPositions] = useState<Positions>(['', '', '', '', ''])
  const [loadingResult, setLoadingResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const seasonById = useMemo(() => new Map(seasons.map((s) => [s.id, s])), [seasons])
  const selectedSeason: Season | null = resolvedSeasonId ? seasonById.get(resolvedSeasonId) ?? null : null

  const eventById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events])
  const selectedEvent: RaceEvent | null = eventId ? eventById.get(eventId) ?? null : null

  const predictionDeadline = selectedEvent ? new Date(selectedEvent.prediction_deadline) : null
  const locked = result?.is_finalized ?? false

  const canFinalize = Boolean(result && !result.is_finalized)

  useEffect(() => {
    setEventId('')
    setResult(null)
    setPositions(['', '', '', '', ''])
    setSavedAt(null)
  }, [resolvedSeasonId])

  useEffect(() => {
    let mounted = true
    if (!eventId) {
      setResult(null)
      setPositions(['', '', '', '', ''])
      setSavedAt(null)
      return
    }
    setLoadingResult(true)
    setError(null)
    apiFetch<{ result: RaceResult | null }>(`/admin/events/${encodeURIComponent(eventId)}/result`)
      .then((res) => {
        if (!mounted) return
        setResult(res.result)
        if (res.result) setPositions(toPositions(res.result))
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load result')
      })
      .finally(() => {
        if (!mounted) return
        setLoadingResult(false)
      })
    return () => {
      mounted = false
    }
  }, [eventId])

  const setPositionsAndReset = (updater: (prev: Positions) => Positions) => {
    setSavedAt(null)
    setPositions(updater)
  }

  const save = async () => {
    if (!eventId) return
    setError(null)
    setSaving(true)
    try {
      const res = await apiFetch<{ result: RaceResult }>(`/admin/events/${encodeURIComponent(eventId)}/result`, {
        method: 'POST',
        json: { positions },
      })
      setResult(res.result)
      setPositions(toPositions(res.result))
      setSavedAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const finalize = async () => {
    if (!eventId) return
    if (!result) return
    if (result.is_finalized) return
    const ok = window.confirm('确认 finalize？这会计算积分并标记结果为已计分。')
    if (!ok) return
    setError(null)
    setSaving(true)
    try {
      await apiFetch(`/admin/events/${encodeURIComponent(eventId)}/finalize`, { method: 'POST' })
      setResult((prev) => (prev ? { ...prev, is_finalized: true } : prev))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'finalize 失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-600">结果录入</div>
            <div className="mt-1 text-xl font-semibold text-zinc-900">Top5 保存与 finalize 计分</div>
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
              onClick={() => void reloadDrivers()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" />
              刷新车手
            </button>
            <button
              type="button"
              onClick={() => void reloadEvents()}
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

          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">比赛</div>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              disabled={!resolvedSeasonId}
            >
              <option value="">请选择比赛</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {`R${e.round} · ${e.grand_prix_name} · ${e.session_type}`}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedEvent ? (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-zinc-900">{`Round ${selectedEvent.round} · ${selectedEvent.grand_prix_name} · ${selectedEvent.session_type}`}</div>
                <div className="mt-1 text-xs text-zinc-600">
                  {selectedSeason ? `赛季：${selectedSeason.year}` : null}
                  {predictionDeadline ? ` · 预测截止：${format(predictionDeadline, 'yyyy-MM-dd HH:mm')}` : null}
                </div>
              </div>
              <div>
                {result?.is_finalized ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
                    <Lock className="h-4 w-4" />
                    已 finalize
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    可录入（不受预测截止影响）
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {seasonsError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{seasonsError}</div>
        ) : null}
        {eventsError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{eventsError}</div>
        ) : null}
        {driversError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{driversError}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {(seasonsLoading || eventsLoading || driversLoading || loadingResult) ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载…
          </div>
        ) : null}
      </div>

      <ResultEditor
        eventId={eventId}
        locked={locked}
        drivers={drivers}
        positions={positions}
        setPositions={setPositionsAndReset}
        saving={saving}
        savedAt={savedAt}
        canFinalize={canFinalize}
        onSave={() => void save()}
        onFinalize={() => void finalize()}
      />
    </div>
  )
}
