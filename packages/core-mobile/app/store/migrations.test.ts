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
})
