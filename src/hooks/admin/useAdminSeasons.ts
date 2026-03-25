import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'
import type { Season } from '@/utils/types'

export function useAdminSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ seasons: Season[] }>('/admin/seasons')
      setSeasons(res.seasons)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load seasons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { seasons, setSeasons, loading, error, reload }
}

