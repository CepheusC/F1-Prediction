import type { SeriesEventLabel, SeriesLine } from '@/utils/types'

export type ChartRow = { x: string } & Record<string, number | string>

export function buildChartRows(args: { events: SeriesEventLabel[]; series: SeriesLine[] }) {
  const keys = args.series.map((s) => `u_${s.user_id}`)
  const labelByKey = new Map(keys.map((k, i) => [k, args.series[i].nickname]))

  const rows: ChartRow[] = args.events.map((e, idx) => {
    const row: ChartRow = { x: e.label }
    for (let i = 0; i < args.series.length; i++) {
      const key = keys[i]
      row[key] = args.series[i].points[idx] ?? 0
    }
    return row
  })

  return { rows, keys, labelByKey }
}

export function defaultColor(idx: number) {
  const palette = ['#0f172a', '#2563eb', '#16a34a', '#ef4444', '#a855f7', '#f59e0b', '#0891b2', '#db2777']
  return palette[idx % palette.length]
}
