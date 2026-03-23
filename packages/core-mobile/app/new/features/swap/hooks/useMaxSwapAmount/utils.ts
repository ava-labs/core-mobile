import type { NetworkFees } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'

enum ChainFamily {
  EVM = 'evm',
  Solana = 'solana',
  Other = 'other'
}

const getChainFamily = (chainId: string): ChainFamily => {
  if (chainId.startsWith('eip155:')) return ChainFamily.EVM
  if (chainId.startsWith('solana:')) return ChainFamily.Solana
  return ChainFamily.Other
}

export type RouteAdditiveBpsConfig = {
  default: number
  evmToSolana: number
  solanaToEvm: number
}

/**
 * Returns the additive fee safety buffer (bps) to use for the given route.
 * Values come from PostHog feature flags so they can be adjusted remotely.
 */
export const getRouteAdditiveBps = (
  fromChainId: string | undefined,
  toChainId: string | undefined,
  config: RouteAdditiveBpsConfig
): number => {
  if (!fromChainId || !toChainId) return config.default
  const from = getChainFamily(fromChainId)
  const to = getChainFamily(toChainId)
  // EVM → Solana
  if (from === ChainFamily.EVM && to === ChainFamily.Solana)
    return config.evmToSolana

  // Solana → EVM
  if (from === ChainFamily.Solana && to === ChainFamily.EVM)
    return config.solanaToEvm

  // All other routes
  return config.default
}

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
  additiveFee,
  hasEstimationError
}: {
  fromToken: LocalTokenWithBalance | undefined
  isNative: boolean
  bufferedGas: bigint | undefined
  additiveFee: bigint
  hasEstimationError: boolean
}): bigint | undefined => {
  if (!fromToken) return undefined

  if (isNative) {
    // Fall back to full balance if fee estimation failed
    if (hasEstimationError) return fromToken.balance

    // Wait for fee estimate before enabling Max button
    if (bufferedGas === undefined) return undefined

    const max = fromToken.balance - bufferedGas - additiveFee
    return max > 0n ? max : undefined
  }

  // ERC20/SPL: gas is paid in the chain's native asset, but additive fees
  // denominated in the source token must be deducted.
  const max = fromToken.balance - additiveFee
  return max > 0n ? max : undefined
}
