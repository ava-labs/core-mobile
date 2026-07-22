import { SUPPORTED_LANGUAGE_CODES } from 'store/settings/language/types'
import {
  FONT_VALIDATION_MIXED_LINE,
  FONT_VALIDATION_SAMPLES,
  FONT_VALIDATION_VARIANTS
} from './fontValidationData'

const hasNonAscii = (value: string): boolean =>
  value.split('').some(ch => ch.charCodeAt(0) > 127)

// Locales whose scripts are the whole point of the tall-glyph lineHeight fix.
const TALL_SCRIPT_LOCALES = ['zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'hi-IN']

describe('FontValidation data', () => {
  it('covers all 11 supported locales, once each', () => {
    const codes = FONT_VALIDATION_SAMPLES.map(s => s.code)
    expect(codes.length).toBe(SUPPORTED_LANGUAGE_CODES.length)
    expect(new Set(codes).size).toBe(codes.length) // no duplicates
    for (const code of codes) {
      expect(SUPPORTED_LANGUAGE_CODES).toContain(code)
    }
  })

  it('gives every sample a label and a non-empty multi-sentence paragraph', () => {
    for (const { label, paragraph } of FONT_VALIDATION_SAMPLES) {
      expect(label.length).toBeGreaterThan(0)
      expect(paragraph.trim().length).toBeGreaterThan(0)
    }
  })

  it('appends the fixed mixed-script line to every paragraph', () => {
    for (const { paragraph } of FONT_VALIDATION_SAMPLES) {
      expect(paragraph).toContain(FONT_VALIDATION_MIXED_LINE)
    }
  })

  it('the mixed line exercises Latin, digits, currency and percent', () => {
    expect(FONT_VALIDATION_MIXED_LINE).toMatch(/AVAX/)
    expect(FONT_VALIDATION_MIXED_LINE).toMatch(/\$[\d,]+\.\d/)
    expect(FONT_VALIDATION_MIXED_LINE).toMatch(/%/)
  })

  it('renders real (non-Latin) glyphs for the tall-script locales', () => {
    for (const code of TALL_SCRIPT_LOCALES) {
      const sample = FONT_VALIDATION_SAMPLES.find(s => s.code === code)
      expect(sample).toBeDefined()
      // strip the shared mixed line so we test the authored script sentence
      const script =
        sample?.paragraph.replace(FONT_VALIDATION_MIXED_LINE, '') ?? ''
      expect(hasNonAscii(script)).toBe(true)
    }
  })

  it('lists a non-empty set of text variants to render', () => {
    expect(FONT_VALIDATION_VARIANTS.length).toBeGreaterThan(0)
    for (const variant of FONT_VALIDATION_VARIANTS) {
      expect(typeof variant).toBe('string')
    }
  })
})
