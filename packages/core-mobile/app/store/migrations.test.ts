import { migrations } from './migrations'

describe('migration 29 — quickSwaps default-fill', () => {
  it('fills quickSwaps when missing', () => {
    const before = {
      settings: { advanced: { developerMode: false, isLeftHanded: false } }
    }
    const after = (migrations as any)[29](before)
    expect(after.settings.advanced.quickSwaps).toEqual({
      isEnabled: false,
      feeSetting: 'medium',
      maxBuy: 'unlimited'
    })
    expect(after.settings.advanced.developerMode).toBe(false)
    expect(after.settings.advanced.isLeftHanded).toBe(false)
  })

  it('preserves existing quickSwaps (idempotent)', () => {
    const existing = {
      isEnabled: true,
      feeSetting: 'high' as const,
      maxBuy: '10000' as const
    }
    const before = {
      settings: { advanced: { developerMode: true, quickSwaps: existing } }
    }
    const after = (migrations as any)[29](before)
    expect(after.settings.advanced.quickSwaps).toBe(existing)
  })

  it('handles missing settings.advanced gracefully', () => {
    const before = { settings: {} }
    const after = (migrations as any)[29](before)
    expect(after.settings.advanced.quickSwaps).toEqual({
      isEnabled: false,
      feeSetting: 'medium',
      maxBuy: 'unlimited'
    })
  })
})
