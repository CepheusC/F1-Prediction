import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'
import type { RaceEvent } from '@/utils/types'

export function useAdminEvents(seasonId: string | null) {
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!seasonId) {
      setEvents([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ events: RaceEvent[] }>(
        `/admin/events?seasonId=${encodeURIComponent(seasonId)}`,
      )
      setEvents(res.events)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { events, setEvents, loading, error, reload }
}

