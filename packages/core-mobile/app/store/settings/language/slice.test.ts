import type { RootState } from 'store/types'
import {
  languageReducer,
  selectSelectedLanguage,
  setSelectedLanguage
} from './slice'
import { initialState } from './types'

const wrap = (language: typeof initialState) =>
  ({ settings: { language } } as unknown as RootState)

describe('language slice', () => {
  it('defaults to en-US', () => {
    expect(initialState.selected).toBe('en-US')
    expect(selectSelectedLanguage(wrap(initialState))).toBe('en-US')
  })

  it('setSelectedLanguage updates the value', () => {
    const next = languageReducer(initialState, setSelectedLanguage('es-ES'))
    expect(next.selected).toBe('es-ES')
  })

  it('setSelectedLanguage clamps an unsupported code to en-US', () => {
    const next = languageReducer(initialState, setSelectedLanguage('xx-XX'))
    expect(next.selected).toBe('en-US')
  })

  it('selector falls back to en-US for an unsupported code', () => {
    // simulate untrusted rehydrated state holding a code outside LanguageCode
    const next = { selected: 'xx-XX' } as unknown as typeof initialState
    expect(selectSelectedLanguage(wrap(next))).toBe('en-US')
  })
})
