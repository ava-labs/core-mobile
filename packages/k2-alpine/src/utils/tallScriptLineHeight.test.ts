import React from 'react'
import {
  containsTallScript,
  detectTallScript,
  resolveTallScriptLineHeight
} from './tallScriptLineHeight'

describe('containsTallScript', () => {
  it('returns false for a Latin-only string', () => {
    expect(containsTallScript('Settings · Send · Receive')).toBe(false)
  })
  it('returns true for Simplified/Traditional Chinese (Han)', () => {
    expect(containsTallScript('设置')).toBe(true)
  })
  it('returns true for Japanese (Hiragana/Katakana)', () => {
    expect(containsTallScript('こんにちは')).toBe(true)
  })
  it('returns true for Korean (Hangul)', () => {
    expect(containsTallScript('한국어')).toBe(true)
  })
  it('returns true for Devanagari', () => {
    expect(containsTallScript('हिन्दी')).toBe(true)
  })
  it('returns true for a mixed Latin + CJK string', () => {
    expect(containsTallScript('AVAX · 送信 · 0.5')).toBe(true)
  })
  it('returns false for a number child', () => {
    expect(containsTallScript(42)).toBe(false)
  })
  it('returns false for null/undefined/boolean children', () => {
    expect(containsTallScript(null)).toBe(false)
    expect(containsTallScript(undefined)).toBe(false)
    expect(containsTallScript(false)).toBe(false)
  })
  it('flattens an array of children', () => {
    expect(containsTallScript(['AVAX ', '送信'])).toBe(true)
    expect(containsTallScript(['AVAX ', 'Send'])).toBe(false)
  })
  it('recurses into nested element children', () => {
    const nested = React.createElement('span', null, '한국어')
    expect(containsTallScript(nested)).toBe(true)
  })
})

describe('detectTallScript', () => {
  it('returns undefined for Latin', () => {
    expect(detectTallScript('Send')).toBeUndefined()
  })
  it('returns "cjk" for CJK', () => {
    expect(detectTallScript('설정')).toBe('cjk')
    expect(detectTallScript('設定')).toBe('cjk')
  })
  it('returns "devanagari" for Devanagari', () => {
    expect(detectTallScript('हिन्दी')).toBe('devanagari')
  })
  it('prefers "devanagari" when a string mixes both', () => {
    expect(detectTallScript('设置 हिन्दी')).toBe('devanagari')
  })
})

describe('resolveTallScriptLineHeight (ratio only)', () => {
  const tight = { fontSize: 36, lineHeight: 36 }

  it('returns undefined for Latin text', () => {
    expect(resolveTallScriptLineHeight(tight, 'Settings')).toBeUndefined()
  })
  it('applies the CJK ratio (1.2)', () => {
    expect(resolveTallScriptLineHeight(tight, '设置')).toBe(44) // ceil(36*1.2)
  })
  it('applies the larger Devanagari ratio (1.35)', () => {
    expect(resolveTallScriptLineHeight(tight, 'हिन्दी')).toBe(49) // ceil(36*1.35)
  })
  it('leaves an already-generous variant untouched', () => {
    expect(
      resolveTallScriptLineHeight({ fontSize: 15, lineHeight: 24 }, '送信')
    ).toBeUndefined()
  })
  it('fast-path returns undefined once lineHeight clears the Devanagari ratio', () => {
    // fontSize 20 → tallest (Devanagari) relaxed = ceil(20*1.35) = 27; a
    // lineHeight of 27 already clears it, so even Devanagari needs no bump.
    expect(
      resolveTallScriptLineHeight({ fontSize: 20, lineHeight: 27 }, 'हिन्दी')
    ).toBeUndefined()
  })
})
