import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'
import { useAuthStore } from '@/store/auth'

export type Me = {
  user: { id: string; email: string | null }
  profile: { user_id: string; nickname: string; role: 'user' | 'admin'; created_at: string } | null
}

export function useMe() {
  const token = useAuthStore((s) => s.accessToken)
  const [data, setData] = useState<Me | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (!token) {
      setData(null)
      setError(null)
      setLoading(false)
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    apiFetch<Me>('/me')
      .then((res) => {
        if (!mounted) return
        setData({ user: res.user, profile: res.profile })
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load user')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  return { me: data, loading, error }
}
