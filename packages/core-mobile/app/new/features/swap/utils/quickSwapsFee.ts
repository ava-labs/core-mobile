import type { FeeRateTier, GasSettings } from '@avalabs/fusion-sdk'
import type { NetworkFees } from '@avalabs/vm-module-types'
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

// Builds the `GasSettings` handed to the Fusion SDK. The base always carries
// the estimate-gas margin; the EIP-1559 tier override (maxFeePerGas /
// maxPriorityFeePerGas) is layered on only when `applyTierOverride` is true
// AND live `networkFees` are available.
//
// The tier override matters because the SDK's one-click batch path
// (`transferAsset` / recurring `executeFirstFill`) does NOT estimate fees for
// the batched txs — it only spreads `maybe1559(gasSettings)` onto them. Without
// an explicit `maxFeePerGas` here the batch txs reach mobile's `signBatch` with
// no fees, tripping the "must be broadcast-ready" guard and forcing the SDK's
// per-tx fallback (sequential approvals). Regular quick-swaps pass the override
// only when active; recurring first-fills always need it. (CP-14641)
export const buildFusionGasSettings = ({
  networkFees,
  feeSetting,
  estimateGasMarginBps,
  applyTierOverride
}: {
  networkFees: NetworkFees | undefined
  feeSetting: QuickSwapFeeLevel
  estimateGasMarginBps: number
  applyTierOverride: boolean
}): GasSettings => {
  const base: GasSettings = { estimateGasMarginBps }
  if (!applyTierOverride) return base

  const suggested: SuggestedGasFees | undefined = networkFees && {
    slow: networkFees.low,
    normal: networkFees.medium,
    fast: networkFees.high
  }
  const tierOverride = mapFeeSettingToGasSettings(feeSetting, suggested)
  return tierOverride ? { ...base, ...tierOverride } : base
}
