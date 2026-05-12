/**
 * Number of decimal digits required to express `step` exactly. Works for
 * non-power-of-10 steps (e.g. 0.25 → 2), unlike `-log10(step)` which only
 * handles 10⁻ⁿ.
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
