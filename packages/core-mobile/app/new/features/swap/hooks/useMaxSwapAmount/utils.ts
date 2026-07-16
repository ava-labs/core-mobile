import type { NetworkFees } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import { getSwappableBalance } from '../../utils/getSwappableBalance'

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

/**
 * Returns the amount to use for the pre-quote request.
 * Uses max(50% of balance, minimumTransferAmount) — using the minimum alone
 * can result in a 'done/no-quotes' event from the SDK.
 */
export const getPreQuoteAmount = (
  minimumTransferAmount: bigint | null | undefined,
  fromToken: LocalTokenWithBalance | undefined
): bigint | null | undefined => {
  if (minimumTransferAmount === undefined || minimumTransferAmount === null) {
    return minimumTransferAmount
  }
  if (!fromToken) return minimumTransferAmount
  const halfBalance = getSwappableBalance(fromToken) / 2n
  return halfBalance > minimumTransferAmount
    ? halfBalance
    : minimumTransferAmount
}

/**
 * Resolves the additive fee to pass to computeMaxAmount.
 * Returns undefined while the pre-quote is loading (Max stays disabled),
 * 0n if it failed (fall back to full balance), or the buffered fee when ready.
 */
export const resolveAdditiveFeeForMax = (
  preQuoteFailed: boolean,
  isQuoteReady: boolean,
  bufferedAdditiveFee: bigint
): bigint | undefined => {
  if (preQuoteFailed) return 0n
  if (!isQuoteReady) return undefined
  return bufferedAdditiveFee
}

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
  additiveFee: bigint | undefined
  hasEstimationError: boolean
}): bigint | undefined => {
  if (!fromToken) return undefined

  // Use the swappable balance (excludes P/X-chain staked/locked funds) as the
  // ceiling so Max can't select more than the user can actually swap (CP-14788).
  const swappableBalance = getSwappableBalance(fromToken)

  if (isNative) {
    // Fall back to full swappable balance if fee estimation failed
    if (hasEstimationError) return swappableBalance

    // Wait for fee estimate before enabling Max button
    if (bufferedGas === undefined) return undefined

    const max = swappableBalance - bufferedGas - (additiveFee ?? 0n)
    return max > 0n ? max : undefined
  }

  // Wait for the pre-quote so additive fees are known before enabling Max.
  if (additiveFee === undefined) return undefined

  // For non-native tokens (ERC20/SPL): gas is paid in the chain's native asset, but additive fees
  // denominated in the source token must be deducted.
  const max = swappableBalance - additiveFee
  return max > 0n ? max : undefined
}
