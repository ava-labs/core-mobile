import { clamp } from '../../utils/clamp'
import { getStepDecimals } from '../../utils/getStepDecimals'

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

// Worklet form of the readout's natural-digit formatting: fixed to
// `decimals`, then trailing zeros (and any dangling dot) stripped. No regex
// so it stays UI-thread safe. Mirrors DialReadout's `naturalDigits` so the
// progress-driven live display and the controlled-value display agree.
export const formatNatural = (v: number, decimals: number): string => {
  'worklet'
  if (decimals <= 0) return `${Math.round(v)}`
  const s = v.toFixed(decimals)
  let end = s.length
  while (end > 0 && s.charAt(end - 1) === '0') end -= 1
  if (end > 0 && s.charAt(end - 1) === '.') end -= 1
  return s.substring(0, end)
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

// Maps a finger offset from the arc centre (dx, dy in canvas space, screen
// y-down; radius = arc radius) to progress 0..1 along the upper semicircle:
// left end (−r, 0) → 0, top (0, −r) → 0.5, right end (r, 0) → 1. Above the
// diameter the dial tracks the finger's angle (Apple-dial style) rather than a
// swipe direction, so there's no up/down mapping to invert.
//
// On or below the diameter the finger is off the arc. Rather than pin to the
// nearest end — which makes a drag that strays below hard-switch between min
// and max as it crosses the centre — fall back to the finger's horizontal
// position across the arc's width, so the value keeps sweeping smoothly while
// out of bounds. The two branches agree at the ends and the centre (only the
// off-axis interior differs), so crossing the diameter along the arc is smooth.
export const progressFromCanvasPoint = (
  dx: number,
  dy: number,
  radius: number
): number => {
  'worklet'
  if (dy >= 0) return clamp((dx + radius) / (2 * radius), 0, 1)
  return clamp((Math.atan2(dy, dx) + Math.PI) / Math.PI, 0, 1)
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

// Empty / whitespace / partial (".") drafts commit 0 so a cleared field
// reaches 0 instead of reverting to the previous value — otherwise a seeded
// input (e.g. staking's min) can't be cleared (CP-14578). Manual input does
// NOT snap to step (`9999.42` with step=10 stays `9999.42`); the gesture's
// `onEnd` handles snapping.
export const commitDraftText = (draft: string, max: number): number => {
  const parsed = Number(draft)
  if (draft.trim() === '' || !Number.isFinite(parsed)) return 0
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
//
// `isSettling` extends that skip across the brief window just after a
// drag releases: `isActive` flips false synchronously on the UI thread at
// lift, but the JS thread is still draining stale mid-drag onChange echoes.
// Those echoes differ from the snapped final by more than a step, so
// without this guard they'd be re-synced into progressSv and jerk the arc
// on their own after the finger is gone.
export const shouldSyncExternalValue = ({
  value,
  currentValue,
  max,
  step,
  isActive,
  isSettling = false
}: {
  value: number
  currentValue: number
  max: number
  step: number
  isActive: boolean
  isSettling?: boolean
}): { sync: false } | { sync: true; target: number } => {
  if (isActive || isSettling) return { sync: false }
  const target = clamp(value, 0, max)
  const diff = Math.abs(currentValue - target)
  if (diff <= step) return { sync: false }
  return { sync: true, target }
}
