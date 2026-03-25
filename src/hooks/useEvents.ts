import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/utils/api'
import type { RaceEvent } from '@/utils/types'

export function useEvents(seasonId: string | null) {
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    if (!seasonId) {
      setEvents([])
      setLoading(false)
      return () => {
        mounted = false
      }
    }

    apiFetch<{ events: RaceEvent[] }>(`/public/events?seasonId=${encodeURIComponent(seasonId)}`, {
      auth: false,
    })
      .then((res) => {
        if (!mounted) return
        setEvents(res.events)
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load events')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [seasonId])

  const byId = useMemo(() => new Map(events.map((e) => [e.id, e])), [events])

  return { events, byId, loading, error }
}
