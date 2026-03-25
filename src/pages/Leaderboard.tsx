import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useCurrentSeason } from '@/hooks/useCurrentSeason'
import { apiFetch } from '@/utils/api'
import type { LeaderboardRow, SeriesEventLabel, SeriesLine } from '@/utils/types'
import { buildChartRows, defaultColor } from '@/utils/series'

export default function Leaderboard() {
  const { season, loading: seasonLoading, error: seasonError } = useCurrentSeason()
  const seasonId = season?.id ?? null

  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [events, setEvents] = useState<SeriesEventLabel[]>([])
  const [series, setSeries] = useState<SeriesLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    if (!seasonId) {
      setLoading(false)
      return () => {
        mounted = false
      }
    }
    setLoading(true)
    setError(null)

    Promise.all([
      apiFetch<{ leaderboard: LeaderboardRow[] }>(`/public/leaderboard?seasonId=${encodeURIComponent(seasonId)}`, {
        auth: false,
      }),
      apiFetch<{ events: SeriesEventLabel[]; series: SeriesLine[] }>(`/public/series?seasonId=${encodeURIComponent(seasonId)}`, {
        auth: false,
      }),
    ])
      .then(([lb, ser]) => {
        if (!mounted) return
        setLeaderboard(lb.leaderboard)
        setEvents(ser.events)
        setSeries(ser.series)

        const topUserIds = lb.leaderboard.slice(0, 5).map((r) => r.user_id)
        setVisible(new Set(topUserIds.map((id) => `u_${id}`)))
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load leaderboard')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [seasonId])

  const chart = useMemo(() => buildChartRows({ events, series }), [events, series])
  const visibleKeys = chart.keys.filter((k) => visible.has(k))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-600">排行榜</div>
            <div className="mt-1 text-xl font-semibold text-zinc-900">{season ? `${season.year} 赛季` : '—'}</div>
          </div>
        </div>

        {seasonError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{seasonError}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {seasonLoading || loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载…
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white lg:col-span-1">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
            <div className="text-sm font-medium text-zinc-900">总积分</div>
            <div className="text-xs text-zinc-500">Top {leaderboard.length}</div>
          </div>
          <div className="divide-y divide-zinc-100">
            {leaderboard.length === 0 && !loading ? (
              <div className="px-5 py-8 text-center text-sm text-zinc-500">暂无积分数据</div>
            ) : null}
            {leaderboard.map((row, idx) => (
              <div key={row.user_id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-xs font-semibold text-zinc-500">#{idx + 1}</span>
                    <span className="truncate text-sm font-medium text-zinc-900">{row.nickname}</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-zinc-900">{row.total_score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white lg:col-span-2">
          <div className="border-b border-zinc-200 px-5 py-3">
            <div className="text-sm font-medium text-zinc-900">积分走势</div>
            <div className="mt-1 text-xs text-zinc-500">默认展示前 5 名，可在下方勾选切换</div>
          </div>

          <div className="h-[360px] px-2 py-4">
            {chart.rows.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">暂无走势数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="#e4e4e7" strokeDasharray="4 4" />
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip />
                  <Legend />
                  {visibleKeys.map((k, idx) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={chart.labelByKey.get(k) ?? k}
                      stroke={defaultColor(idx)}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="border-t border-zinc-200 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {series.map((s, idx) => {
                const key = `u_${s.user_id}`
                const checked = visible.has(key)
                return (
                  <label
                    key={s.user_id}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setVisible((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(key)
                          else next.delete(key)
                          return next
                        })
                      }}
                    />
                    <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: defaultColor(idx) }} />
                    <span>{s.nickname}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
