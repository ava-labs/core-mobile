/**
 * Formats a `StakeFeePolicy.rate` (a fraction in [0, 1)) as a display
 * percentage string with no superfluous decimals.
 *
 * Plain `rate * 100` is unsafe to render directly because IEEE-754
 * multiplication can produce artifacts for some rates (e.g. `0.07 * 100`
 * yields `7.000000000000001`). Rounding to two decimals and stripping
 * trailing zeros gives a clean "10" / "10.5" / "2.55" surface without
 * locking the caption to a fixed precision.
 */
export const formatFeePercent = (rate: number): string => {
  const percent = rate * 100
  // `toFixed(2)` rounds away any floating-point noise (e.g. `7.000…01` →
  // "7.00"). `parseFloat` then strips trailing zeros so whole-number
  // percentages render as "10" rather than "10.00".
  return parseFloat(percent.toFixed(2)).toString()
}
