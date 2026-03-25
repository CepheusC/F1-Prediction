import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'
import type { AdminDriver } from '@/utils/types'

export function useAdminDrivers() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ drivers: AdminDriver[] }>('/admin/drivers')
      setDrivers(res.drivers)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { drivers, setDrivers, loading, error, reload }
}

