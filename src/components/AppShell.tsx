import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Flag, Info, LogOut, Shield, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useMe } from '@/hooks/useMe'

function TopNav() {
  const navigate = useNavigate()
  const clear = useAuthStore((s) => s.clear)
  const { me } = useMe()

  const nickname = me?.profile?.nickname ?? me?.user.email ?? 'User'
  const isAdmin = me?.profile?.role === 'admin'

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Flag className="h-4 w-4" />
          </span>
          <span className="text-sm">F1 预测</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100',
                isActive && 'bg-zinc-100 text-zinc-900',
              )
            }
          >
            比赛
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100',
                isActive && 'bg-zinc-100 text-zinc-900',
              )
            }
          >
            <Trophy className="h-4 w-4" />
            排行榜
          </NavLink>
          <NavLink
            to="/info"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100',
                isActive && 'bg-zinc-100 text-zinc-900',
              )
            }
          >
            <Info className="h-4 w-4" />
            说明
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100',
                  isActive && 'bg-zinc-100 text-zinc-900',
                )
              }
            >
              <Shield className="h-4 w-4" />
              管理员
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-zinc-600 sm:inline">{nickname}</span>
          <button
            type="button"
            onClick={() => {
              clear()
              navigate('/login', { replace: true })
            }}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <LogOut className="h-4 w-4" />
            退出
          </button>
        </div>
      </div>
    </header>
  )
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
