import type { AdminDriver } from '@/utils/types'

export type DriverDraft = {
  name: string
  team: string
  is_active: boolean
}

export function toDraft(d?: AdminDriver | null): DriverDraft {
  return {
    name: d?.name ?? '',
    team: d?.team ?? '',
    is_active: d?.is_active ?? true,
  }
}

