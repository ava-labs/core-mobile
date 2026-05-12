export type LeverageGaugeProps = {
  // Required
  value: number
  onChange: (value: number) => void
  min: number
  max: number

  // Optional — range
  step?: number
  /**
   * Number of decimal places to show in the displayed value. When omitted,
   * it's inferred from `step` (e.g. step=0.2 → 1 decimal, step=1 → 0).
   * Set to 0 to always show integers regardless of step.
   */
  decimals?: number
  /**
   * If true, the gauge only accepts integer values. Overrides `decimals` to
   * 0, swaps the keyboard to number-pad, and strips non-digit characters
   * from typed input.
   */
  integersOnly?: boolean

  // Optional — behavior
  enableManualInput?: boolean
  subtitle?: string

  // Optional — feedback
  hapticsEnabled?: boolean
  onCommit?: (value: number) => void

  // Optional — release physics (defaults chosen for a calm, iOS-like feel)
  /**
   * Multiplier applied to the finger's release velocity. Higher = more
   * powerful flicks for the same swipe speed (longer coast). Default: 1.
   */
  velocityPower?: number
  /**
   * How much friction slows the coast. Range just-under-1:
   *   0.9999 → very long, nearly frictionless coast
   *   0.998  → iOS ScrollView default
   *   0.99   → short, decisive coast
   * Default: 0.9991.
   */
  coastDeceleration?: number

  // Testing
  testID?: string
}
