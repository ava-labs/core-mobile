import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
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
        f.fundingModel === 'additive' &&
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

/**
 * Extracts non-bridge additive fees denominated in the source token.
 *
 * For ERC20 tokens: sums fees where fundingModel === 'additive', type !== 'bridge',
 * and the fee token address matches the source token address.
 * For SPL tokens: same matching by mint address.
 * For native tokens: returns 0n (bridge fee handles native additive fees separately).
 */
export const extractSourceTokenAdditiveFee = (
  quote: Quote,
  fromToken: LocalTokenWithBalance
): bigint => {
  if (fromToken.type === TokenType.NATIVE) return 0n

  return quote.fees
    .filter(f => {
      if (f.fundingModel !== 'additive' || f.type === 'bridge') return false
      if (f.chainId !== quote.sourceChain.chainId) return false

      if (
        fromToken.type === TokenType.ERC20 &&
        f.token.type === 'erc20' &&
        'address' in f.token
      ) {
        return f.token.address.toLowerCase() === fromToken.address.toLowerCase()
      }

      if (
        fromToken.type === TokenType.SPL &&
        f.token.type === 'spl' &&
        'address' in f.token
      ) {
        return f.token.address === fromToken.address
      }

      return false
    })
    .reduce((sum, f) => sum + f.amount, 0n)
}

/**
 * Returns the non-bridge additive fee for the source token with a safety buffer,
 * or 0n when no such fees exist.
 */
export const getSourceTokenAdditiveFee = (
  fromToken: LocalTokenWithBalance | undefined,
  quote: Quote | null,
  safetyBps: number
): bigint => {
  if (!fromToken || !quote) return 0n
  const fee = extractSourceTokenAdditiveFee(quote, fromToken)
  return (fee * (10000n + BigInt(safetyBps))) / 10000n
}
