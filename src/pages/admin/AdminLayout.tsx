import { NavLink, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { CalendarDays, Flag, ListChecks, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

function Tab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100',
          isActive && 'bg-zinc-100 text-zinc-900',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

export default function AdminLayout() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-sm text-zinc-600">管理员</div>
        <div className="mt-1 text-xl font-semibold text-zinc-900">数据维护与结算</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Tab to="/admin" icon={<Flag className="h-4 w-4" />} label="概览" />
          <Tab to="/admin/drivers" icon={<Users className="h-4 w-4" />} label="车手" />
          <Tab to="/admin/seasons" icon={<CalendarDays className="h-4 w-4" />} label="赛季" />
          <Tab to="/admin/events" icon={<Flag className="h-4 w-4" />} label="比赛" />
          <Tab to="/admin/results" icon={<ListChecks className="h-4 w-4" />} label="结果" />
        </div>
      </div>

      <Outlet />
    </div>
  )
}
