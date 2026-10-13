import {
  DEFAULT_LANGUAGE,
  LANGUAGE_MMKV_KEY,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LANGUAGE_CODES
} from './types'

describe('language types', () => {
  it('defaults to en-US', () => {
    expect(DEFAULT_LANGUAGE).toBe('en-US')
  })

  it('lists 11 supported languages including en-US', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(11)
    expect(SUPPORTED_LANGUAGE_CODES).toContain('en-US')
    expect(SUPPORTED_LANGUAGE_CODES).toContain('ru-RU')
  })

  it('derives codes from the language list', () => {
    expect(SUPPORTED_LANGUAGE_CODES).toEqual(
      SUPPORTED_LANGUAGES.map(l => l.code)
    )
  })

  it('uses a stable MMKV cache key', () => {
    expect(LANGUAGE_MMKV_KEY).toBe('language')
  })
})
