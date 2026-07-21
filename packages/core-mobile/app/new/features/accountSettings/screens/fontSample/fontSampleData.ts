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
// (Latin-only) font families. `size`/`lineHeight` mirror the k2-alpine text
// tokens (theme/tokens/text.ts) so the screen can render each variant both
// "as-is" (token lineHeight) and "relaxed" — surfacing that variants with
// lineHeight === fontSize clip CJK/Devanagari on iOS.
export const FONT_SAMPLE_VARIANTS = [
  { variant: 'heading2', family: 'Aeonik-Bold', size: 36, lineHeight: 36 },
  { variant: 'heading4', family: 'Aeonik-Bold', size: 24, lineHeight: 27 },
  { variant: 'heading5', family: 'Inter-SemiBold', size: 21, lineHeight: 21 },
  { variant: 'body1', family: 'Inter-Regular', size: 15, lineHeight: 18 },
  {
    variant: 'buttonMedium',
    family: 'Inter-SemiBold',
    size: 15,
    lineHeight: 18
  },
  { variant: 'caption', family: 'Inter-Regular', size: 11, lineHeight: 14 },
  { variant: 'mono', family: 'DejaVuSansMono', size: 12, lineHeight: 16 }
] as const

// Multiplier applied to fontSize for the "relaxed" line-height comparison row —
// enough headroom for CJK glyphs + Devanagari matras without clipping.
export const RELAXED_LINE_HEIGHT_RATIO = 1.4
