import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useMe } from '@/hooks/useMe'

export default function AdminGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  const { me, loading, error } = useMe()

  if (!token) return <Navigate to="/login" replace />

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在检查管理员权限…
        </div>
      </div>
    )
  }

  const isAdmin = me?.profile?.role === 'admin'
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold text-zinc-900">无权限</div>
            <div className="mt-1 text-sm text-zinc-600">
              {error ? `无法校验权限：${error}` : '此页面仅管理员可访问。'}
            </div>
            <div className="mt-4">
              <Link
                to={location.state?.from ?? '/'}
                className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

