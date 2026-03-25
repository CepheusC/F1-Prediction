import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { format, formatDistanceToNowStrict, isAfter } from 'date-fns'
import { ChevronRight, Clock, Flag, Loader2 } from 'lucide-react'
import { useCurrentSeason } from '@/hooks/useCurrentSeason'
import { useEvents } from '@/hooks/useEvents'
import { cn } from '@/lib/utils'

function Pill({ children, tone }: { children: ReactNode; tone: 'open' | 'locked' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'open' && 'bg-emerald-50 text-emerald-700',
        tone === 'locked' && 'bg-zinc-100 text-zinc-700',
      )}
    >
      {children}
    </span>
  )
}

export default function Home() {
  const { season, loading: seasonLoading, error: seasonError } = useCurrentSeason()
  const { events, loading: eventsLoading, error: eventsError } = useEvents(season?.id ?? null)

  const loading = seasonLoading || eventsLoading
  const error = seasonError || eventsError

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-600">当前赛季</div>
            <div className="mt-1 text-xl font-semibold text-zinc-900">{season ? `${season.year}` : '—'}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Flag className="h-5 w-5" />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载比赛…
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
          <div className="text-sm font-medium text-zinc-900">比赛列表</div>
          <div className="text-xs text-zinc-500">点击进入单场预测</div>
        </div>
        <div className="divide-y divide-zinc-100">
          {events.length === 0 && !loading ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-500">暂无比赛数据</div>
          ) : null}

          {Array.from(
            events.reduce((map, e) => {
              const list = map.get(e.round) ?? []
              list.push(e)
              map.set(e.round, list)
              return map
            }, new Map<number, typeof events>()),
          )
            .sort(([a], [b]) => a - b)
            .map(([round, roundEvents]) => {
              const title = roundEvents[0]?.grand_prix_name ?? ''
              const dateStr = roundEvents[0]?.event_date ?? ''
              return (
                <div key={round} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">Round {round} · {title}</div>
                      <div className="mt-1 text-xs text-zinc-500">{dateStr ? `比赛日：${dateStr}` : null}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {roundEvents.map((e) => {
                      const deadline = new Date(e.prediction_deadline)
                      const locked = isAfter(new Date(), deadline)
                      return (
                        <Link
                          key={e.id}
                          to={`/events/${e.id}`}
                          className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:bg-zinc-50"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-900">{e.session_type}</span>
                              <Pill tone={locked ? 'locked' : 'open'}>{locked ? '已截止' : '可提交'}</Pill>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                截止：{format(deadline, 'MM-dd HH:mm')}
                              </span>
                              <span className="text-zinc-500">({formatDistanceToNowStrict(deadline, { addSuffix: true })})</span>
                            </div>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 flex-none text-zinc-400" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
