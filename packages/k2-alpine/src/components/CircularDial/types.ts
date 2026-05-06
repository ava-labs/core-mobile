import { StyleProp, ViewStyle } from 'react-native'

export type PresetButton = {
  /** Rendered label, e.g. "25%", "Max". */
  label: string
  /** Target fraction of `max`, clamped to [0, 1]. */
  fraction: number
}

export type CircularDialProps = {
  value: number
  onChange: (value: number) => void
  max: number
  /**
   * Threshold below which values are considered invalid — the amount
   * flips to the danger colour and a tick is rendered on the track.
   * Defaults to `0` (no threshold; the track always spans `0..max`).
   * Must satisfy `0 ≤ min ≤ max`.
   */
  min?: number
  /**
   * Snap granularity. When omitted, derived from `max` so the dial
   * always offers ~1000 stops (e.g. max 10000 → step 10, max 1000 →
   * step 1, max <100 → step 0.1).
   */
  step?: number
  /**
   * Number of decimals shown on the readout. When omitted, inferred
   * from `step` (e.g. 0.01 → 2, 1 → 0).
   */
  decimals?: number
  /**
   * Cap on how many decimal places the user can type in the manual
   * input. When omitted, no cap is applied.
   */
  maxDecimals?: number
  /**
   * Small text above the amount — typically the currency code or unit
   * (`"USD"`, `"%"`). The dial itself shows the raw number.
   */
  label?: string
  /**
   * Placeholder shown when the user clears all digits while editing.
   * Defaults to `"0"`.
   */
  placeholder?: string
  /**
   * Small text below the amount — typically a converted value
   * (`"$177.31 USD"`). Inherits the danger colour when the value is
   * below the `min` threshold.
   */
  caption?: string
  enableManualInput?: boolean
  /** Quick-select buttons below the dial. Defaults to 25% / 50% / Max. */
  presets?: PresetButton[]
  onCommit?: (v: number) => void
  /** Default `true`. */
  hapticsEnabled?: boolean
  testID?: string
  containerStyle?: StyleProp<ViewStyle>
}
