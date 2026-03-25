import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format, isAfter } from 'date-fns'
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { useDrivers } from '@/hooks/useDrivers'
import { useCurrentSeason } from '@/hooks/useCurrentSeason'
import { useEvents } from '@/hooks/useEvents'
import { apiFetch } from '@/utils/api'
import type { Prediction } from '@/utils/types'

type Positions = [string, string, string, string, string]

function toPositions(p: Prediction): Positions {
  return [
    p.position_1_driver_id,
    p.position_2_driver_id,
    p.position_3_driver_id,
    p.position_4_driver_id,
    p.position_5_driver_id,
  ]
}

export default function EventPrediction() {
  const { id } = useParams()
  const eventId = id ?? ''

  const { drivers, loading: driversLoading, error: driversError } = useDrivers()
  const { season } = useCurrentSeason()
  const { byId } = useEvents(season?.id ?? null)
  const event = byId.get(eventId) ?? null

  const [loadingPrediction, setLoadingPrediction] = useState(true)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [positions, setPositions] = useState<Positions>(['', '', '', '', ''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const deadline = event ? new Date(event.prediction_deadline) : null
  const lockedByTime = deadline ? isAfter(new Date(), deadline) : false
  const locked = lockedByTime || prediction?.is_locked === true

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers])
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

  const complete = positions.every((p) => Boolean(p))
  const canSubmit = complete && !duplicates && !locked

  useEffect(() => {
    let mounted = true
    if (!eventId) return
    setLoadingPrediction(true)
    setError(null)
    apiFetch<{ prediction: Prediction | null }>(`/events/${encodeURIComponent(eventId)}/my-prediction`)
      .then((res) => {
        if (!mounted) return
        setPrediction(res.prediction)
        if (res.prediction) setPositions(toPositions(res.prediction))
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load prediction')
      })
      .finally(() => {
        if (!mounted) return
        setLoadingPrediction(false)
      })
    return () => {
      mounted = false
    }
  }, [eventId])

  const updatePos = (idx: number, value: string) => {
    setSavedAt(null)
    setPositions((prev) => {
      const next = [...prev] as Positions
      next[idx] = value
      return next
    })
  }

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      const res = await apiFetch<{ prediction: Prediction }>(`/events/${encodeURIComponent(eventId)}/prediction`, {
        method: 'POST',
        json: { positions },
      })
      setPrediction(res.prediction)
      setPositions(toPositions(res.prediction))
      setSavedAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          返回比赛列表
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-600">单场预测</div>
            <div className="mt-1 text-lg font-semibold text-zinc-900">
              {event ? `Round ${event.round} · ${event.grand_prix_name} · ${event.session_type}` : '加载中…'}
            </div>
            <div className="mt-2 text-sm text-zinc-600">{deadline ? `截止时间：${format(deadline, 'yyyy-MM-dd HH:mm')}` : '—'}</div>
          </div>

          <div className="flex items-center gap-2">
            {locked ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
                <Lock className="h-4 w-4" />
                已截止，禁止修改
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                可提交/修改
              </span>
            )}
          </div>
        </div>

        {driversError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{driversError}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {savedAt ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            已保存：{format(new Date(savedAt), 'HH:mm:ss')}
          </div>
        ) : null}

        {(driversLoading || loadingPrediction) && !driversError ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载数据…
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-3">
          <div className="text-sm font-medium text-zinc-900">预测前五名</div>
          <div className="mt-1 text-xs text-zinc-500">同一位车手不能出现在多个位置</div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {([1, 2, 3, 4, 5] as const).map((pos, idx) => (
            <label key={pos} className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">P{pos}</div>
              <select
                value={positions[idx]}
                disabled={locked}
                onChange={(e) => updatePos(idx, e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              >
                <option value="">请选择车手</option>
                {drivers.map((d) => {
                  const selectedSomewhereElse = selectedSet.has(d.id) && positions[idx] !== d.id
                  return (
                    <option key={d.id} value={d.id} disabled={selectedSomewhereElse}>
                      {d.name}{d.team ? ` · ${d.team}` : ''}
                    </option>
                  )
                })}
              </select>
              {positions[idx] ? (
                <div className="mt-1 truncate text-xs text-zinc-500">{driverById.get(positions[idx])?.name ?? '—'}</div>
              ) : null}
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-zinc-200 px-5 py-4">
          <div className="text-xs text-zinc-600">
            {duplicates ? <span className="text-red-700">存在重复车手，请调整</span> : <span>无重复</span>}
            {!complete ? <span className="ml-2 text-zinc-500">（还未选满 5 位）</span> : null}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            提交预测
          </button>
        </div>
      </div>
    </div>
  )
}
