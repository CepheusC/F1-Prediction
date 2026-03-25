import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'
import type { Driver } from '@/utils/types'

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch<{ drivers: Driver[] }>('/public/drivers', { auth: false })
      .then((res) => {
        if (!mounted) return
        setDrivers(res.drivers)
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load drivers')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { drivers, loading, error }
}
