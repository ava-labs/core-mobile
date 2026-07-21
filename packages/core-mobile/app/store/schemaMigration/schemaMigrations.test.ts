import { QUICK_SWAPS_DEFAULT } from '../settings/advanced/types'
import { DEFAULT_LANGUAGE } from '../settings/language/types'
import { migrations } from './schemaMigrations'

describe('migration 29 — quickSwaps default-fill', () => {
  it('fills quickSwaps with QUICK_SWAPS_DEFAULT when missing', () => {
    const before = {
      settings: { advanced: { developerMode: false, isLeftHanded: false } }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after = (migrations as any)[29](before)
    expect(after.settings.advanced.quickSwaps).toEqual(QUICK_SWAPS_DEFAULT)
    expect(after.settings.advanced.developerMode).toBe(false)
    expect(after.settings.advanced.isLeftHanded).toBe(false)
  })
})

describe('migration 30 — filterSmallUtxos default-fill', () => {
  it('fills filterSmallUtxos with true when missing', () => {
    const before = {
      settings: { advanced: { developerMode: false, isLeftHanded: false } }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after = (migrations as any)[30](before)
    expect(after.settings.advanced.filterSmallUtxos).toBe(true)
    // untouched siblings survive
    expect(after.settings.advanced.developerMode).toBe(false)
  })

  it('preserves an existing false value', () => {
    const before = { settings: { advanced: { filterSmallUtxos: false } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after = (migrations as any)[30](before)
    expect(after.settings.advanced.filterSmallUtxos).toBe(false)
  })
})

describe('migration 31 — language default-fill', () => {
  it('fills settings.language.selected with en-US when missing', () => {
    const before = { settings: { advanced: { developerMode: false } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after = (migrations as any)[31](before)
    expect(after.settings.language.selected).toBe(DEFAULT_LANGUAGE)
    // untouched siblings survive
    expect(after.settings.advanced.developerMode).toBe(false)
  })

  it('preserves an existing selected language', () => {
    const before = { settings: { language: { selected: 'ja-JP' } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after = (migrations as any)[31](before)
    expect(after.settings.language.selected).toBe('ja-JP')
  })
})
