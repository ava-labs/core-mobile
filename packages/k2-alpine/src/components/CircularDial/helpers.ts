export const clamp = (v: number, min: number, max: number): number => {
  'worklet'
  if (v < min) return min
  if (v > max) return max
  return v
}

// Works for non-power-of-10 steps (e.g. 0.25 → 2), unlike `-log10(step)`
// which would lose precision.
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

// Step doesn't always evenly divide max (e.g. step=2, max=7 → round=8 > 7);
// when that happens we step down once. toFixed runs *before* the compare so
// boundary float drift (3 * 0.1 = 0.30000000000000004) doesn't trip the clamp.
export const snapToStep = (v: number, step: number, max: number): number => {
  'worklet'
  const decimals = getStepDecimals(step)
  const snapped = Number((Math.round(v / step) * step).toFixed(decimals))
  if (snapped < 0) return 0
  if (snapped <= max) return snapped
  return Number((snapped - step).toFixed(decimals))
}

// Sweep convention: 180° (9 o'clock) at progress=0, 270° (12 o'clock)
// at 0.5, 360° (3 o'clock) at progress=1.
export const progressToPoint = ({
  progress,
  cx,
  cy,
  radius
}: {
  progress: number
  cx: number
  cy: number
  radius: number
}): { x: number; y: number } => {
  'worklet'
  const angleDeg = 180 + clamp(progress, 0, 1) * 180
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  }
}

export const valueToProgress = (value: number, max: number): number => {
  'worklet'
  if (max <= 0) return 0
  return clamp(value / max, 0, 1)
}

// Never clamps the lower bound — users may still be typing their way
// toward a valid value (e.g. `"0.0…"`).
export const sanitizeDecimalInput = (text: string, max: number): string => {
  const stripped = text.replace(/[^\d.]/g, '')
  const firstDot = stripped.indexOf('.')
  const collapsed =
    firstDot === -1
      ? stripped
      : stripped.slice(0, firstDot + 1) +
        stripped.slice(firstDot + 1).replace(/\./g, '')
  // Normalise leading zeros: collapse runs of leading zeros to one,
  // then drop that one if a digit follows (so "00" → "0", "023" →
  // "23", "0023" → "23"). Keep "0" and "0.x" intact.
  const normalized = collapsed.replace(/^0+/, '0').replace(/^0(?=\d)/, '')
  if (normalized === '' || normalized === '.') return normalized
  const parsed = Number(normalized)
  if (Number.isFinite(parsed) && parsed > max) return `${max}`
  return normalized
}

// Manual input is the precision escape hatch — does NOT snap to step,
// so `9999.42` with step=10 commits as `9999.42`, not `10000`. Slides
// snap separately via the gesture's `onEnd`.
export const commitDraftText = (draft: string, max: number): number | null => {
  const parsed = Number(draft)
  if (!Number.isFinite(parsed) || draft.trim() === '') return null
  return clamp(parsed, 0, max)
}

type ValidatedRange = {
  max: number
  step: number
  isValid: boolean
}

export const validateRange = ({
  max,
  step
}: {
  max: number
  step: number
}): ValidatedRange => {
  let isValid = true
  let normalizedStep = step
  if (max <= 0) {
    // eslint-disable-next-line no-console
    console.warn(`[CircularDial] max (${max}) must be > 0.`)
    isValid = false
  }
  if (step <= 0 || step > max) {
    // Fallback must be ≤ max so we don't immediately re-violate the invariant.
    const fallback = max > 0 ? Math.min(0.01, max) : 0.01
    // eslint-disable-next-line no-console
    console.warn(
      `[CircularDial] step (${step}) must be > 0 and <= max. Falling back to step=${fallback}.`
    )
    normalizedStep = fallback
  }
  return { max, step: normalizedStep, isValid }
}

// Skips syncing while a gesture / animation owns the dial, and dampens
// echoes — when the diff is within one step, the incoming value is
// likely our own onChange bubbling back as controlled state.
export const shouldSyncExternalValue = ({
  value,
  currentValue,
  max,
  step,
  isActive
}: {
  value: number
  currentValue: number
  max: number
  step: number
  isActive: boolean
}): { sync: false } | { sync: true; target: number } => {
  if (isActive) return { sync: false }
  const target = clamp(value, 0, max)
  const diff = Math.abs(currentValue - target)
  if (diff <= step) return { sync: false }
  return { sync: true, target }
}
