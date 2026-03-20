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
  additiveFee,
  hasEstimationError
}: {
  fromToken: LocalTokenWithBalance | undefined
  isNative: boolean
  bufferedGas: bigint | undefined
  bridgeFee: bigint
  additiveFee: bigint
  hasEstimationError: boolean
}): bigint | undefined => {
  if (!fromToken) return undefined

  if (isNative) {
    // Fall back to full balance if fee estimation failed
    if (hasEstimationError) return fromToken.balance

    // Wait for fee estimate before enabling Max button
    if (bufferedGas === undefined) return undefined

    const max = fromToken.balance - bufferedGas - bridgeFee
    return max > 0n ? max : undefined
  }

  // ERC20/SPL: gas is paid in the chain's native asset, but non-bridge
  // additive fees are denominated in the source token and must be deducted.
  const max = fromToken.balance - additiveFee
  return max > 0n ? max : undefined
}
