import React, { ReactNode } from 'react'

/** The tall-script families we adjust lineHeight for. */
export type TallScript = 'cjk' | 'devanagari'

/**
 * Devanagari (U+0900–097F). Split out from the other tall scripts because its
 * stacked matras (above AND below the base glyph) need more vertical room than
 * CJK, so it gets a larger lineHeight ratio.
 */
export const DEVANAGARI_RE = /[\u0900-\u097f]/

/**
 * CJK: Hiragana/Katakana (U+3040–30FF), CJK Ext-A (U+3400–4DBF), CJK Unified
 * (U+4E00–9FFF), Hangul syllables (U+AC00–D7AF), CJK Compatibility Ideographs
 * (U+F900–FAFF). Full-height ideographs that clip when a variant sets
 * `lineHeight` at/near `fontSize`.
 */
export const CJK_RE =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/

/**
 * Per-script lineHeight/fontSize ratios. These are empirical starting values —
 * tune against a real iOS build (via the Font sample QA screen). Devanagari is
 * larger than CJK because of its stacked marks.
 */
export const CJK_LINE_HEIGHT_RATIO = 1.2
export const DEVANAGARI_LINE_HEIGHT_RATIO = 1.35

// Flatten arbitrary React children into their plain-text content so the script
// check works on strings, numbers, arrays, and nested <Text> elements alike.
const flattenText = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean')
    return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenText).join('')
  if (React.isValidElement(node)) {
    return flattenText((node.props as { children?: ReactNode })?.children)
  }
  return ''
}

const RATIO: Record<TallScript, number> = {
  cjk: CJK_LINE_HEIGHT_RATIO,
  devanagari: DEVANAGARI_LINE_HEIGHT_RATIO
}

/**
 * The tall script a string belongs to, or undefined if it needs no adjustment.
 * Devanagari is checked first so a string mixing both scripts gets the larger
 * (safer) ratio.
 */
export const detectTallScript = (
  children: ReactNode
): TallScript | undefined => {
  const text = flattenText(children)
  if (DEVANAGARI_RE.test(text)) return 'devanagari'
  if (CJK_RE.test(text)) return 'cjk'
  return undefined
}

/** Whether the rendered text contains any CJK/Devanagari glyphs. */
export const containsTallScript = (children: ReactNode): boolean =>
  detectTallScript(children) !== undefined

/**
 * The per-script ratio adjustment. Returns `ceil(fontSize * ratio)` (ceil,
 * never round) using the per-script ratio, and only when it exceeds the
 * variant's own lineHeight — variants that already have room are left as
 * designed.
 */
export const resolveTallScriptLineHeight = (
  spec: { fontSize: number; lineHeight: number },
  children: ReactNode
): number | undefined => {
  const script = detectTallScript(children)
  if (script === undefined) return undefined
  const relaxed = Math.ceil(spec.fontSize * RATIO[script])
  return relaxed > spec.lineHeight ? relaxed : undefined
}

/**
 * Decides the lineHeight the `Text` primitive should inject for a given render.
 * A caller-provided lineHeight always wins (returns `undefined` so nothing is
 * overridden); otherwise falls back to the per-script tall-script adjustment for
 * the resolved variant spec.
 */
export const resolveTextLineHeight = ({
  spec,
  children,
  callerLineHeight
}: {
  spec?: { fontSize: number; lineHeight: number }
  children: ReactNode
  callerLineHeight?: number
}): number | undefined => {
  if (callerLineHeight !== undefined) return undefined
  if (!spec) return undefined
  return resolveTallScriptLineHeight(spec, children)
}
