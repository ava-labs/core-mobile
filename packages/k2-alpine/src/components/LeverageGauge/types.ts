export type Preset = number | 'min' | 'max'

export type LeverageGaugeProps = {
  // Required
  value: number
  onChange: (value: number) => void
  min: number
  max: number

  // Optional — range
  step?: number
  presets?: Preset[]
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
  formatValue?: (v: number) => string
  subtitle?: string

  // Optional — feedback
  onHapticTick?: boolean
  onCommit?: (value: number) => void

  // Testing
  testID?: string
}
