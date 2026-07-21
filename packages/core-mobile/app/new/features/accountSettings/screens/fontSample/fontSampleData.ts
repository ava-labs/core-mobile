// Data for the FontSample QA screen (CP-14859). The sample languages are the
// script-bearing ones whose catalogs carry real (non-Latin) glyphs, plus en-US
// as a Latin baseline for weight/size comparison. Strings are read live from
// the i18n catalogs via getFixedT, so this stays in sync with the catalogs.

export const FONT_SAMPLE_LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'hi-IN', label: 'हिन्दी' }
] as const

// Catalog keys rendered per language (must exist in the scaffold catalogs).
export const FONT_SAMPLE_KEYS = [
  'Settings',
  'Send',
  'Receive',
  'Account'
] as const

// A representative spread of k2-alpine Text variants covering all three bundled
// (Latin-only) font families. Only the variant NAMES live here — the screen
// reads each variant's fontFamily/fontSize/lineHeight from `theme.text[variant]`
// at runtime, so this QA screen never drifts from the k2-alpine tokens.
export const FONT_SAMPLE_VARIANTS = [
  'heading2',
  'heading4',
  'heading5',
  'body1',
  'buttonMedium',
  'caption',
  'mono'
] as const

// Multiplier applied to fontSize for the "relaxed" line-height comparison row —
// enough headroom for CJK glyphs + Devanagari matras without clipping.
export const RELAXED_LINE_HEIGHT_RATIO = 1.4
