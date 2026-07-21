// Verifies the screen's engine: getFixedT renders real per-language glyphs from
// the catalogs (the render itself is a thin map over this). MMKV is mocked so
// initI18n can seed synchronously in the test environment.
jest.mock('utils/mmkv/storages', () => ({
  commonStorage: { getString: jest.fn(), set: jest.fn() }
}))

import i18n from 'i18next'
import { initI18n } from 'i18n'
import { SUPPORTED_LANGUAGE_CODES } from 'store/settings/language/types'
import { FONT_SAMPLE_KEYS, FONT_SAMPLE_LANGUAGES } from './fontSampleData'

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
      expect(en(key)).toBe(key) // natural-string key => value equals key in en
    }
  })

  it('getFixedT returns real per-language glyphs (not the English key)', () => {
    expect(i18n.getFixedT('ja-JP')('Settings')).toBe('設定')
    expect(i18n.getFixedT('zh-CN')('Settings')).toBe('设置')
    expect(i18n.getFixedT('zh-TW')('Settings')).toBe('設定')
    expect(i18n.getFixedT('ko-KR')('Settings')).toBe('설정')
    expect(i18n.getFixedT('hi-IN')('Settings')).toBe('सेटिंग्स')
    expect(i18n.getFixedT('en-US')('Settings')).toBe('Settings')
  })
})
