import type { Quote } from '../types'

/**
 * Extracts the bridge fee in the source chain's native token from a
 * quote's fee list. This fee is added on top of the swap amount in the
 * transaction value for cross-chain native swaps.
 */
export const extractBridgeFee = (quote: Quote): bigint => {
  return quote.fees
    .filter(
      f =>
        f.type === 'bridge' &&
        f.token.type === 'native' &&
        f.chainId === quote.sourceChain.chainId
    )
    .reduce((sum, f) => sum + f.amount, 0n)
}

/**
 * Returns the bridge fee for a native token swap with a safety buffer applied,
 * or 0n for non-native swaps (no bridge fee added to tx.value).
 */
export const getNativeBridgeFee = (
  isNative: boolean,
  quote: Quote | null,
  safetyBps: number
): bigint => {
  if (isNative && quote) {
    const bridgeFee = extractBridgeFee(quote)
    return (bridgeFee * (10000n + BigInt(safetyBps))) / 10000n
  }

  return 0n
}
