import { describe, expect, it } from 'vitest'
import { toIsoFromLocalInput, toLocalInputFromIso } from './datetime'

describe('datetime helpers', () => {
  it('converts local input to ISO and back', () => {
    const local = '2026-03-25T18:30'
    const iso = toIsoFromLocalInput(local)
    expect(iso).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
    const back = toLocalInputFromIso(iso)
    expect(back).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  })
})

