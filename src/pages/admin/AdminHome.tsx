import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { CalendarDays, ListChecks, PlusCircle, Users } from 'lucide-react'

function Card({
  title,
  desc,
  to,
  icon,
}: {
  title: string
  desc: string
  to: string
  icon: ReactNode
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">{desc}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">{icon}</div>
      </div>
    </Link>
  )
}

export default function AdminHome() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="车手管理" desc="新增/编辑/启用停用" to="/admin/drivers" icon={<Users className="h-5 w-5" />} />
      <Card title="赛季创建" desc="创建赛季（year）" to="/admin/seasons" icon={<CalendarDays className="h-5 w-5" />} />
      <Card title="比赛创建" desc="创建 race/quali/sprint 等 session" to="/admin/events" icon={<PlusCircle className="h-5 w-5" />} />
      <Card title="结果录入" desc="录入前五 + finalize 计分" to="/admin/results" icon={<ListChecks className="h-5 w-5" />} />
    </div>
  )
}
