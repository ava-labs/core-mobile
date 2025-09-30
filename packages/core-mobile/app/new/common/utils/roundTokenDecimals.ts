/**
 * Rounds a bigint token amount to a certain number of decimal places
 * without affecting the integer part.
 *
 * Rules:
 * - If `displayDecimals >= tokenDecimals`, the value is returned unchanged.
 * - Otherwise, the value is floored to the nearest unit that represents
 *   the desired number of display decimals.
 * - If flooring would produce 0 while the original value is non-zero,
 *   the original value is returned (so very small balances are preserved
 *   instead of being shown as 0).
 *
 * Example (BTC, 8 decimals):
 *   roundTokenDecimals(123456789n, 8, 2)
 *   → 123456789n (because 0.00000123456789 BTC would floor to 0, so we keep it)
 *
 * Example (USDC, 6 decimals):
 *   roundTokenDecimals(123456789n, 6, 2)
 *   → 123450000n (123.456789 → 123.45)
 *
 * @param value - amount in smallest units
 * @param tokenDecimals - the token's native decimals
 * @param displayDecimals - how many decimals to keep (default = 3)
 * @returns bigint rounded for display
 */
export const roundTokenDecimals = (
  value: bigint,
  tokenDecimals: number,
  displayDecimals = 3
): bigint => {
  if (displayDecimals >= tokenDecimals) return value
  if (value <= 0n) return value

  const factor = 10n ** BigInt(tokenDecimals - displayDecimals)
  const rounded = (value / factor) * factor
  return rounded === 0n ? value : rounded
}
