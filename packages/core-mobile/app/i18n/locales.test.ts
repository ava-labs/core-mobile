import { SUPPORTED_LANGUAGE_CODES } from 'store/settings/language/types'
import { LOCALES } from './locales'

describe('LOCALES registry', () => {
  it('has a thunk for every supported language', () => {
    for (const code of SUPPORTED_LANGUAGE_CODES) {
      expect(typeof LOCALES[code]).toBe('function')
    }
  })

  it('en-US thunk returns a catalog with real keys', () => {
    const catalog = LOCALES['en-US']?.()
    expect(catalog?.Settings).toBe('Settings')
  })

  it('es-ES thunk returns the distinct Spanish value', () => {
    expect(LOCALES['es-ES']?.().Settings).toBe('Ajustes')
  })

  it('has exactly the supported codes — no drift, no orphans', () => {
    expect(Object.keys(LOCALES).sort()).toEqual(
      [...SUPPORTED_LANGUAGE_CODES].sort()
    )
  })
})
