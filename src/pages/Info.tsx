import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <div className="text-sm font-medium text-zinc-900">{title}</div>
        <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-zinc-200 px-5 py-4 text-sm text-zinc-700">
        {children}
      </div>
    </details>
  )
}

export default function Info() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="text-sm text-zinc-600">说明</div>
        <div className="mt-1 text-xl font-semibold text-zinc-900">规则与附加信息</div>
        <div className="mt-2 text-sm text-zinc-600">这里汇总了计分规则与项目说明，方便参赛者快速上手。</div>
      </div>

      <Section title="得分规则（如何预测更容易拿高分）">
        <div className="space-y-3">
          <div>
            每个 session（排位 / 正赛 / 冲刺等）都要预测 Top5。管理员录入真实 Top5 并 finalize 后，系统会计算你这一场的得分。
          </div>

          <div className="space-y-1">
            <div className="font-medium text-zinc-900">总分 = 位置得分 + 排序奖励</div>
            <div>
              位置得分：对你预测的 P1~P5 分别给基础分，然后根据该车手在真实 Top5 的位置差扣分。
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm">
            <div className="font-medium text-zinc-900">基础分（按你预测的位置）</div>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              <div>P1：25</div>
              <div>P2：18</div>
              <div>P3：15</div>
              <div>P4：12</div>
              <div>P5：10</div>
            </div>
            <div className="mt-3 text-zinc-700">每差 1 个名次扣 4 分：单个位置得分 = max(0, 基础分 - 4 * |Δ|)</div>
            <div className="mt-2 text-zinc-700">如果你选的车手没进真实 Top5：按 |Δ| = 5 计算（会被重扣，但仍可能剩少量分）</div>
          </div>

          <div className="space-y-1">
            <div className="font-medium text-zinc-900">排序奖励（进阶）</div>
            <div>
              你预测的 5 人里，任意两位车手 (A,B)：如果你预测 A 在 B 前，而且真实结果里 A 也在 B 前，这一对就奖励 2 分。
              只有当 A、B 都在真实 Top5 中才会参与计算。
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-medium text-zinc-900">更容易拿高分的小策略</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>优先保证“谁能进 Top5”靠谱：不进真实 Top5 会被重扣。</li>
              <li>冠军位（P1）最关键：猜对冠军通常收益最大。</li>
              <li>尽量让强弱顺序合理：即使位置有偏差，排序奖励也能补分。</li>
              <li>不确定两人谁前谁后时，把更稳的放前面通常更赚。</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="开发者说明">
        <div className="space-y-2">
          <ul className="list-disc space-y-1 pl-5">
            <li>本项目为vibe coding实验项目</li>
            <li>不保证长期维护与更新</li>
            <li>交流与反馈：duanxy23[at]mails[dot]tsinghua[dot]edu[dot]cn</li>
          </ul>
        </div>
      </Section>
    </div>
  )
}
