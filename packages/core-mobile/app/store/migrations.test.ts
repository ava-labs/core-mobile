import { migrations } from './migrations'
import { QUICK_SWAPS_DEFAULT } from './settings/advanced/types'

describe('migration 29 — quickSwaps default-fill', () => {
  it('fills quickSwaps with QUICK_SWAPS_DEFAULT when missing', () => {
    const before = {
      settings: { advanced: { developerMode: false, isLeftHanded: false } }
    }
    const after = (migrations as any)[29](before)
    expect(after.settings.advanced.quickSwaps).toEqual(QUICK_SWAPS_DEFAULT)
    expect(after.settings.advanced.developerMode).toBe(false)
    expect(after.settings.advanced.isLeftHanded).toBe(false)
  })
})
