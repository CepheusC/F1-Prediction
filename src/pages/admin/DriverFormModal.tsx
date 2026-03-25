import { Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { DriverDraft } from '@/pages/admin/driverDraft'

export default function DriverFormModal({
  open,
  title,
  draft,
  setDraft,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  draft: DriverDraft
  setDraft: (updater: (prev: DriverDraft) => DriverDraft) => void
  saving: boolean
  error: string | null
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">姓名</div>
          <input
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="例如：Max Verstappen"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">车队（可选）</div>
          <input
            value={draft.team}
            onChange={(e) => setDraft((p) => ({ ...p, team: e.target.value }))}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="例如：Red Bull"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => setDraft((p) => ({ ...p, is_active: e.target.checked }))}
          />
          启用
        </label>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || !draft.name.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            保存
          </button>
        </div>
      </div>
    </Modal>
  )
}
