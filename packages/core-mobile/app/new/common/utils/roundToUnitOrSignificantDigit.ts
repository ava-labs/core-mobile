/**
 * Rounds or simplifies a BigInt value according to its magnitude.
 *
 * - If `value` is greater than or equal to 10^exponent, rounds down to the nearest multiple of 10^exponent.
 * - If `value` is positive but less than 10^exponent, reduces it to its most significant digit followed by zeros.
 * - Returns zero or negative values unchanged.
 *
 * @param value – The BigInt value to normalize.
 * @param exponent – The exponent for the rounding unit (10^exponent).
 * @returns A BigInt rounded or simplified per the rules above.
 */
export function roundToUnitOrSignificantDigit(
  value: bigint,
  exponent: number
): bigint {
  const unit = 10n ** BigInt(exponent)
  if (value >= unit) {
    return (value / unit) * unit
  }
  if (value > 0n) {
    const s = value.toString()
    const lead = BigInt(s[0] ?? 0)
    const exp = BigInt(s.length - 1)
    return lead * 10n ** exp
  }
  return value
}
