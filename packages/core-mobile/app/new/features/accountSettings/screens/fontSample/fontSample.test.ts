// Verifies the screen's engine: getFixedT renders real per-language glyphs from
// the catalogs (the render itself is a thin map over this). MMKV is mocked so
// initI18n can seed synchronously in the test environment.
import i18n from 'i18next'
import { initI18n } from 'i18n'
import { SUPPORTED_LANGUAGE_CODES } from 'store/settings/language/types'
import { FONT_SAMPLE_KEYS, FONT_SAMPLE_LANGUAGES } from './fontSampleData'

// jest.mock is hoisted above the imports by babel-jest, so keeping it after the
// import block (per the import/first convention) does not change behavior.
jest.mock('utils/mmkv/storages', () => ({
  commonStorage: { getString: jest.fn(), set: jest.fn() }
}))

const hasNonAscii = (value: string): boolean =>
  value.split('').some(ch => ch.charCodeAt(0) > 127)

describe('FontSample data + i18n-driven glyphs', () => {
  beforeAll(async () => {
    await initI18n()
    await i18n.loadLanguages(FONT_SAMPLE_LANGUAGES.map(l => l.code))
  })

  it('every sample language is a supported locale', () => {
    for (const lang of FONT_SAMPLE_LANGUAGES) {
      expect(SUPPORTED_LANGUAGE_CODES).toContain(lang.code)
    }
  })

  it('every sample key exists in the en-US catalog', () => {
    const en = i18n.getFixedT('en-US')
    for (const key of FONT_SAMPLE_KEYS) {
      // t(key) === key is trivially true under natural-key fallback, so assert
      // real presence via exists(); keep toBe(key) for the convention
      expect(i18n.exists(key, { lng: 'en-US' })).toBe(true)
      expect(en(key)).toBe(key)
    }
  })

  it('getFixedT returns real non-Latin glyphs for the non-English locales', () => {
    // Assert "translated + non-ASCII" rather than exact strings, so the test
    // survives real translations landing from Crowdin (CJK/Devanagari values
    // stay non-ASCII regardless of wording).
    const en = i18n.getFixedT('en-US')('Settings')
    expect(en).toBe('Settings')

    for (const { code } of FONT_SAMPLE_LANGUAGES.filter(
      l => l.code !== 'en-US'
    )) {
      const value = i18n.getFixedT(code)('Settings')
      expect(value).not.toBe(en) // a real translation, not the English key
      expect(hasNonAscii(value)).toBe(true) // contains non-Latin glyphs
    }
  })
})
