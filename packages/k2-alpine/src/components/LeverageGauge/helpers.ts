import { clamp } from '../../utils/clamp'
import { getStepDecimals } from '../../utils/getStepDecimals'

export const snapToStep = (v: number, min: number, step: number): number => {
  'worklet'
  const offset = v - min
  const snapped = Math.round(offset / step) * step
  // Avoid floating-point drift by rounding to the step's natural precision.
  const decimals = getStepDecimals(step)
  return min + Number(snapped.toFixed(decimals))
}

export const isMajorTick = (value: number, step: number): boolean => {
  'worklet'
  if (step >= 1) return true
  // Major every integer; compare with epsilon for float safety
  const rounded = Math.round(value)
  return Math.abs(value - rounded) < step / 2
}

type ValidatedRange = {
  min: number
  max: number
  step: number
  isValid: boolean
}

/**
 * Format a number for display — matches what the Skia renderer produces,
 * so the TextInput and read-only display stay visually consistent.
 */
export const formatNumber = (value: number, decimals: number): string =>
  decimals > 0 ? value.toFixed(decimals) : `${value}`

/**
 * Clean a keystroke-level input string: strip disallowed characters when
 * integersOnly, and cap the parsed value at max so the field can never
 * display an out-of-range number mid-edit. Never clamps to min — users
 * may be typing digits one at a time on their way to a valid value.
 */
export const sanitizeTypedText = (
  text: string,
  { integersOnly, max }: { integersOnly: boolean; max: number }
): string => {
  const stripped = integersOnly ? text.replace(/[^\d]/g, '') : text
  const parsed = Number(stripped)
  if (Number.isFinite(parsed) && parsed > max) return `${max}`
  return stripped
}

/**
 * Convert the draft string into a committed value on blur — parse, clamp
 * into [min, max], snap to the nearest step. Returns null when the draft
 * is empty / partial / non-numeric (caller should skip commit).
 */
export const commitDraftText = (
  draft: string,
  { min, max, step }: { min: number; max: number; step: number }
): number | null => {
  const parsed = Number(draft)
  if (!Number.isFinite(parsed) || draft.trim() === '') return null
  return snapToStep(clamp(parsed, min, max), min, step)
}

/**
 * Decides whether an incoming external `value` prop should overwrite the
 * wheel's currently-held position. Skips when the wheel is in an active
 * gesture/animation, and when the difference is within one step (likely an
 * echo of the wheel's own onChange bubbling back through controlled state).
 * Returns the clamped target when sync should proceed.
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
    console.warn(`[LeverageGauge] min (${min}) must be less than max (${max}).`)
    isValid = false
  }

  if (step <= 0 || step > max - min) {
    // eslint-disable-next-line no-console
    console.warn(
      `[LeverageGauge] step (${step}) must be > 0 and <= (max - min). Falling back to step=1.`
    )
    normalizedStep = 1
  }

  return { min, max, step: normalizedStep, isValid }
}
