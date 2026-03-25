import { describe, expect, it } from 'vitest'
import { buildChartRows } from './series'

describe('buildChartRows', () => {
  it('builds chart rows aligned by event index', () => {
    const res = buildChartRows({
      events: [
        { id: 'e1', round: 1, label: '1 - Race', grand_prix_name: 'GP1', event_date: '2026-03-01' },
        { id: 'e2', round: 2, label: '2 - Race', grand_prix_name: 'GP2', event_date: '2026-03-08' },
      ],
      series: [
        { user_id: 'u1', nickname: 'A', points: [10, 12] },
        { user_id: 'u2', nickname: 'B', points: [0, 8] },
      ],
    })

    expect(res.keys).toEqual(['u_u1', 'u_u2'])
    expect(res.rows).toEqual([
      { x: '1 - Race', u_u1: 10, u_u2: 0 },
      { x: '2 - Race', u_u1: 12, u_u2: 8 },
    ])
  })
})
