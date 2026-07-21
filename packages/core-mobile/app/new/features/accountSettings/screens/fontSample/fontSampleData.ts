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
// (Latin-only) font families — so each row exercises the OS glyph-fallback path
// at a different size/weight.
export const FONT_SAMPLE_VARIANTS = [
  { variant: 'heading2', family: 'Aeonik-Bold 36' },
  { variant: 'heading4', family: 'Aeonik-Bold 24' },
  { variant: 'heading5', family: 'Inter-SemiBold 21' },
  { variant: 'body1', family: 'Inter-Regular 15' },
  { variant: 'buttonMedium', family: 'Inter-SemiBold 15' },
  { variant: 'caption', family: 'Inter-Regular 11' },
  { variant: 'mono', family: 'DejaVuSansMono 12' }
] as const
