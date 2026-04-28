export type PresetButton = {
  /** Rendered label, e.g. "25%", "Max". */
  label: string
  /** Target fraction of (max - min), clamped to [0, 1]. */
  fraction: number
}

/**
 * Semantic colour for the filled portion of the arc.
 *  - `success` → green (default; gains, positive amounts)
 *  - `danger`  → red (losses, warnings, risk indicators)
 *  - `neutral` → theme primary (mode-adaptive dark/light fill)
 */
export type DialTone = 'success' | 'danger' | 'neutral'

export type CircularDialProps = {
  // Required
  value: number
  onChange: (value: number) => void
  min: number
  max: number

  // Optional — range
  /**
   * Snap granularity. When omitted, derived from `max` so the dial
   * always offers roughly 1000 stops across the available range:
   *   max 10000 → step 10, max 1000 → step 1, max <100 → step 0.1.
   * Pass an explicit step to override.
   */
  step?: number
  /**
   * Number of decimals shown in the manual-input TextInput. Has no effect
   * on the non-editing display, which is controlled by `formatValue`.
   * When omitted, inferred from `step` (e.g. 0.01 → 2, 1 → 0).
   */
  decimals?: number
  /**
   * Cap on how many decimal places the user can type in the manual
   * input. When omitted, no cap is applied (typed precision is whatever
   * the user enters). Useful for currency inputs that should never go
   * below a cent (`maxDecimals: 2`).
   */
  maxDecimals?: number

  // Optional — display
  /**
   * Small text rendered above the amount. Use this for the currency
   * code or unit (e.g. `"USD"`, `"CHF"`, `"%"`) — the dial itself shows
   * the raw number without any prefix or suffix.
   */
  label?: string
  /**
   * Placeholder shown inside the manual-input `TextInput` when the user
   * has cleared all digits while editing.
   */
  placeholder?: string
  /**
   * Optional small text rendered just below the amount — typically a
   * converted value (e.g. `"$177.31 USD"`). When provided, the input
   * and label shift up to make room for it. Inherits the danger colour
   * when the value is below `referenceValue`.
   */
  caption?: string

  // Optional — behaviour
  /**
   * When true, tapping the amount opens an in-place `TextInput` so the
   * user can type a value. Commits on blur / submit, snapped to step.
   */
  enableManualInput?: boolean
  /**
   * Multiplier on how much of `(max - min)` a full-arc-wide swipe covers.
   *  - `1` (default) — swiping 2×radius pixels sweeps the entire range.
   *  - `0.1` — the same swipe only moves the value by 10% of the range;
   *    users need to swipe 10× as far for the same change.
   * Useful when `(max - min)` is very large and the default would make
   * every pixel equal thousands of value units.
   */
  gestureSensitivity?: number

  // Optional — presets
  /**
   * Quick-select buttons below the dial. Each button snaps the dial to
   * `min + fraction * (max - min)`. Defaults to 25% / 50% / Max (100%).
   */
  presets?: PresetButton[]

  // Optional — appearance
  /** Semantic colour of the filled arc segment. Default `success`. */
  tone?: DialTone
  /**
   * Value at which to render a small stationary reference tick on the arc
   * (e.g. entry price, breakeven, origin). Must fall within [min, max].
   * When omitted, no tick is drawn.
   */
  referenceValue?: number

  // Optional — feedback
  onCommit?: (v: number) => void
  /** Default true. */
  hapticsEnabled?: boolean

  // Testing
  testID?: string
}
