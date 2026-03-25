import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'
import type { Season } from '@/utils/types'

export function useCurrentSeason() {
  const [season, setSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch<{ season: Season | null }>('/public/seasons/current', { auth: false })
      .then((res) => {
        if (!mounted) return
        setSeason(res.season)
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load season')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { season, loading, error }
}
