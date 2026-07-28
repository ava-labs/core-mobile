// Mock the MMKV wrapper inline (never reference outer vars in a jest.mock
// factory — jest rejects that / TDZ). Read the mock back via the import.
jest.mock('utils/mmkv/storages', () => ({
  commonStorage: { getString: jest.fn(), set: jest.fn() }
}))

import i18n from 'i18next'
import { commonStorage } from 'utils/mmkv/storages'
import { initI18n } from './index'

const mockGetString = commonStorage.getString as jest.Mock

describe('initI18n', () => {
  it('seeds i18next from the persisted MMKV language with no async gap', async () => {
    mockGetString.mockReturnValue('es-ES')
    await initI18n()
    expect(i18n.language).toBe('es-ES')
    // active locale seeded inline → available synchronously
    expect(i18n.t('Settings')).toBe('Ajustes')
  })

  it('defaults to en-US when the key is unset', async () => {
    mockGetString.mockReturnValue(undefined)
    await initI18n()
    expect(i18n.language).toBe('en-US')
    expect(i18n.t('Settings')).toBe('Settings')
  })

  it('defaults to en-US for an unsupported persisted value', async () => {
    mockGetString.mockReturnValue('xx-XX')
    await initI18n()
    expect(i18n.language).toBe('en-US')
  })

  it('falls back to English for an empty-string value in a non-EN catalog', async () => {
    mockGetString.mockReturnValue('es-ES')
    await initI18n()
    // The extraction pipeline seeds not-yet-translated keys as "" in non-EN
    // catalogs (for Crowdin to fill), with the EN source of truth present.
    // Use a sentinel EN value distinct from the key so the assertion proves the
    // fallback returned the en-US *value* (not just echoed the key as a default).
    i18n.addResource('en-US', 'translation', 'Send', '__EN_FALLBACK__')
    i18n.addResource('es-ES', 'translation', 'Send', '')
    // returnEmptyString:false → the empty es-ES value is treated as missing and
    // falls back to the en-US value instead of rendering blank.
    expect(i18n.t('Send')).toBe('__EN_FALLBACK__')
  })
})
