import type { FeeRateTier } from '@avalabs/fusion-sdk'
import type { QuickSwapFeeLevel } from 'store/settings/advanced/types'

export type SuggestedGasFees = Partial<
  Record<FeeRateTier, { maxFeePerGas: bigint; maxPriorityFeePerGas?: bigint }>
>

type QuickSwapsGasSettings = {
  maxFeePerGas: bigint
  maxPriorityFeePerGas?: bigint
}

export const feeSettingToTier = (level: QuickSwapFeeLevel): FeeRateTier => {
  switch (level) {
    case 'low':
      return 'slow'
    case 'medium':
      return 'normal'
    case 'high':
      return 'fast'
  }
}

export const mapFeeSettingToGasSettings = (
  level: QuickSwapFeeLevel,
  suggestedFees: SuggestedGasFees | undefined
): QuickSwapsGasSettings | undefined => {
  if (!suggestedFees) return undefined
  const picked = suggestedFees[feeSettingToTier(level)]
  if (!picked) return undefined
  return picked
}
