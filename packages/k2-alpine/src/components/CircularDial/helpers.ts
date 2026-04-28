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

export const snapToStep = (v: number, step: number): number => {
  'worklet'
  const snapped = Math.round(v / step) * step
  const decimals = getStepDecimals(step)
  return Number(snapped.toFixed(decimals))
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
  if (collapsed === '' || collapsed === '.') return collapsed
  const parsed = Number(collapsed)
  if (Number.isFinite(parsed) && parsed > max) return `${max}`
  return collapsed
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
    // eslint-disable-next-line no-console
    console.warn(
      `[CircularDial] step (${step}) must be > 0 and <= max. Falling back to step=0.01.`
    )
    normalizedStep = 0.01
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
