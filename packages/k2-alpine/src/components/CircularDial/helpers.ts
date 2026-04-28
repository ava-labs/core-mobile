export const clamp = (v: number, min: number, max: number): number => {
  'worklet'
  if (v < min) return min
  if (v > max) return max
  return v
}

/**
 * Number of decimal digits required to express `step` exactly, derived by
 * scaling until the value is integer (±epsilon). Works for non-power-of-10
 * steps (e.g. 0.25 → 2), unlike `-log10(step)` which only handles 10⁻ⁿ.
 */
export const getStepDecimals = (step: number): number => {
  'worklet'
  if (!Number.isFinite(step) || step <= 0 || step >= 1) return 0
  const epsilon = 1e-8
  let decimals = 0
  let scaled = step
  while (decimals < 10 && Math.abs(scaled - Math.round(scaled)) > epsilon) {
    scaled *= 10
    decimals += 1
  }
  return decimals
}

export const snapToStep = (v: number, min: number, step: number): number => {
  'worklet'
  const offset = v - min
  const snapped = Math.round(offset / step) * step
  const decimals = getStepDecimals(step)
  return min + Number(snapped.toFixed(decimals))
}

/**
 * Position on the arc for a given progress. Uses the same sweep convention
 * as `touchToProgress` — 180° at progress=0, 360° at progress=1.
 */
export const progressToPoint = (
  progress: number,
  cx: number,
  cy: number,
  radius: number
): { x: number; y: number } => {
  'worklet'
  const angleDeg = 180 + clamp(progress, 0, 1) * 180
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  }
}

export const valueToProgress = (
  value: number,
  min: number,
  max: number
): number => {
  'worklet'
  if (max === min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

/**
 * Format a number for display in the manual-input TextInput — matches the
 * step's natural decimal precision so the text stays consistent with how
 * values actually snap.
 */
export const formatNumberForInput = (v: number, decimals: number): string =>
  decimals > 0 ? v.toFixed(decimals) : `${Math.round(v)}`

/**
 * Clean a keystroke-level input string for the dial:
 *   - strip anything except digits and `.`
 *   - collapse multiple dots to the first one
 *   - cap the parsed value at `max`
 * Never clamps to `min` — users may still be typing their way toward a
 * valid value (`"0.0…"`, etc.).
 */
export const sanitizeDecimalInput = (text: string, max: number): string => {
  const stripped = text.replace(/[^\d.]/g, '')
  const firstDot = stripped.indexOf('.')
  const collapsed =
    firstDot === -1
      ? stripped
      : stripped.slice(0, firstDot + 1) +
        stripped.slice(firstDot + 1).replace(/\./g, '')
  if (collapsed === '' || collapsed === '.') return collapsed
  const parsed = Number(collapsed)
  if (Number.isFinite(parsed) && parsed > max) return `${max}`
  return collapsed
}

/**
 * Commit a draft string on blur/submit — parse and clamp into [min, max].
 * Does NOT snap to step: manual input is the precision escape hatch and
 * should preserve whatever the user typed (e.g. typing `9999.42` with
 * step=10 should commit `9999.42`, not snap up to `10000`). Slides still
 * snap to step via the gesture's `onEnd`. Returns null for empty /
 * partial / invalid drafts so the caller can skip committing.
 */
export const commitDraftText = (
  draft: string,
  { min, max }: { min: number; max: number; step?: number }
): number | null => {
  const parsed = Number(draft)
  if (!Number.isFinite(parsed) || draft.trim() === '') return null
  return clamp(parsed, min, max)
}

type ValidatedRange = {
  min: number
  max: number
  step: number
  isValid: boolean
}

export const validateRange = ({
  min,
  max,
  step
}: {
  min: number
  max: number
  step: number
}): ValidatedRange => {
  let isValid = true
  let normalizedStep = step
  if (min >= max) {
    // eslint-disable-next-line no-console
    console.warn(`[CircularDial] min (${min}) must be less than max (${max}).`)
    isValid = false
  }
  if (step <= 0 || step > max - min) {
    // eslint-disable-next-line no-console
    console.warn(
      `[CircularDial] step (${step}) must be > 0 and <= (max - min). Falling back to step=0.01.`
    )
    normalizedStep = 0.01
  }
  return { min, max, step: normalizedStep, isValid }
}

/**
 * Decides whether an incoming external `value` prop should overwrite the
 * dial's current internal position. Skips while a gesture/animation owns
 * the dial (`isActive`), and when the difference is within one step
 * (likely an echo of our own onChange bubbling back as controlled state).
 */
export const shouldSyncExternalValue = ({
  value,
  currentValue,
  min,
  max,
  step,
  isActive
}: {
  value: number
  currentValue: number
  min: number
  max: number
  step: number
  isActive: boolean
}): { sync: false } | { sync: true; target: number } => {
  if (isActive) return { sync: false }
  const target = clamp(value, min, max)
  const diff = Math.abs(currentValue - target)
  if (diff <= step) return { sync: false }
  return { sync: true, target }
}
