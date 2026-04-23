import type { Preset } from './types'

export const clamp = (v: number, min: number, max: number): number => {
  'worklet'
  if (v < min) return min
  if (v > max) return max
  return v
}

export const snapToStep = (v: number, min: number, step: number): number => {
  'worklet'
  const offset = v - min
  const snapped = Math.round(offset / step) * step
  // Avoid floating-point drift for common step sizes
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0
  return min + Number(snapped.toFixed(decimals))
}

export const resolvePreset = (
  preset: Preset,
  min: number,
  max: number
): number => {
  if (preset === 'min') return min
  if (preset === 'max') return max
  return preset
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
