import type { NetworkFees } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'

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
