import type { NetworkFees } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../../types'

export const buildFeeOptions = (
  feeUnitsMarginBps: number,
  networkFee: NetworkFees | undefined
): {
  feeUnitsMarginBps: number
  overrides?: {
    feeRateTier: 'fast'
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
} => ({
  feeUnitsMarginBps,
  ...(networkFee && networkFee.high.maxPriorityFeePerGas !== undefined
    ? {
        overrides: {
          feeRateTier: 'fast' as const,
          maxFeePerGas: networkFee.high.maxFeePerGas,
          maxPriorityFeePerGas: networkFee.high.maxPriorityFeePerGas
        }
      }
    : {})
})

export const computeMaxAmount = ({
  fromToken,
  isNative,
  bufferedGas,
  bridgeFee,
  hasEstimationError
}: {
  fromToken: LocalTokenWithBalance | undefined
  isNative: boolean
  bufferedGas: bigint | undefined
  bridgeFee: bigint
  hasEstimationError: boolean
}): bigint | undefined => {
  if (!fromToken) return undefined

  // Non-native: gas is paid in the chain's native asset — full balance available
  // Also fall back to full balance if fee estimation failed
  if (!isNative || hasEstimationError) return fromToken.balance

  // Native without fee estimate yet: return undefined so the Max button stays disabled
  if (bufferedGas === undefined) return undefined

  const max = fromToken.balance - bufferedGas - bridgeFee
  return max > 0n ? max : 0n
}

/**
 * Extracts the flat bridge/protocol fee in the source chain's native token from
 * a quote's fee list. This fee is added on top of the swap amount in the
 * transaction value for cross-chain native swaps.
 */
export const extractBridgeFee = (quote: Quote): bigint => {
  return quote.fees
    .filter(
      f =>
        (f.type === 'bridge' || f.type === 'protocol') &&
        f.token.type === 'native' &&
        f.chainId === quote.sourceChain.chainId
    )
    .reduce((sum, f) => sum + f.amount, 0n)
}

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
