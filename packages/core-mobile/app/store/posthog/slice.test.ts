import { FeatureGates, FeatureVars } from 'services/posthog/types'
import { WalletType } from 'services/wallet/types'
import { RootState } from 'store/types'
import {
  setFeatureFlags,
  selectIsSeedlessSigningBlocked,
  selectIsFusionEnabled,
  selectFusionFeeUnitsMarginBps,
  selectFusionMaxAmountGasSafetyBps,
  selectFusionTransferGasMarginBps,
  selectFusionMaxAmountAdditiveBpsDefault,
  selectFusionMaxAmountAdditiveBpsEvmToSolana,
  selectFusionMaxAmountAdditiveBpsSolanaToEvm,
  selectMarkrSwapMaxRetries,
  selectSentrySampleRate,
  selectStakeAnnualPercentageYieldBPS,
  selectFastStakeFeeRate,
  selectDelegationFeeRate,
  selectIsFastStakeFeeBlocked,
  selectIsDelegationFeeBlocked,
  posthogSlice
} from './slice'
import { DefaultFeatureFlagConfig, initialState } from './types'

const createMockRootState = (overrides: {
  walletType?: WalletType
  featureFlags?: Partial<typeof DefaultFeatureFlagConfig>
}): RootState => {
  const { walletType = WalletType.MNEMONIC, featureFlags = {} } = overrides

  return {
    app: {
      walletType
    },
    posthog: {
      featureFlags: {
        ...DefaultFeatureFlagConfig,
        ...featureFlags
      }
    }
  } as RootState
}

// ---------------------------------------------------------------------------
// Helper: state with only the given flags (no defaults mixed in)
// ---------------------------------------------------------------------------

const stateWithFlags = (flags: Record<string, unknown> = {}): RootState =>
  ({
    app: { walletType: WalletType.MNEMONIC },
    posthog: { featureFlags: flags }
  } as unknown as RootState)

// ---------------------------------------------------------------------------
// setFeatureFlags reducer
// ---------------------------------------------------------------------------

describe('setFeatureFlags', () => {
  it('replaces featureFlags entirely with the payload', () => {
    // Start from initial state (which has DefaultFeatureFlagConfig)
    const before = initialState
    const payload = { [FeatureGates.FUSION]: true }
    const after = posthogSlice.reducer(before, setFeatureFlags(payload))

    // Only the payload key should be present — not the full DefaultFeatureFlagConfig
    expect(after.featureFlags).toEqual(payload)
  })

  it('does not re-enable flags that PostHog omits (disabled on backend)', () => {
    // PostHog only returns enabled flags; EVERYTHING is absent → should be absent, not true
    const payload = { [FeatureGates.FUSION]: true }
    const after = posthogSlice.reducer(initialState, setFeatureFlags(payload))

    expect(after.featureFlags[FeatureGates.EVERYTHING]).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Numeric selectors — PostHog value present
// ---------------------------------------------------------------------------

describe('numeric selectors — PostHog value present', () => {
  it('selectFusionFeeUnitsMarginBps returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.FUSION_FEE_UNITS_MARGIN_BPS]: '3000'
    })
    expect(selectFusionFeeUnitsMarginBps(state)).toBe(3000)
  })

  it('selectFusionMaxAmountGasSafetyBps returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.FUSION_MAX_AMOUNT_GAS_SAFETY_BPS]: '8000'
    })
    expect(selectFusionMaxAmountGasSafetyBps(state)).toBe(8000)
  })

  it('selectFusionTransferGasMarginBps returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.FUSION_TRANSFER_GAS_MARGIN_BPS]: '1000'
    })
    expect(selectFusionTransferGasMarginBps(state)).toBe(1000)
  })

  it('selectFusionMaxAmountAdditiveBpsDefault returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_DEFAULT]: '2000'
    })
    expect(selectFusionMaxAmountAdditiveBpsDefault(state)).toBe(2000)
  })

  it('selectFusionMaxAmountAdditiveBpsEvmToSolana returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_EVM_TO_SOLANA]: '9000'
    })
    expect(selectFusionMaxAmountAdditiveBpsEvmToSolana(state)).toBe(9000)
  })

  it('selectFusionMaxAmountAdditiveBpsSolanaToEvm returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_SOLANA_TO_EVM]: '700'
    })
    expect(selectFusionMaxAmountAdditiveBpsSolanaToEvm(state)).toBe(700)
  })

  it('selectMarkrSwapMaxRetries returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.MARKR_SWAP_MAX_RETRIES]: '5'
    })
    expect(selectMarkrSwapMaxRetries(state)).toBe(5)
  })

  it('selectSentrySampleRate returns parsed PostHog value divided by 100', () => {
    const state = stateWithFlags({
      [FeatureVars.SENTRY_SAMPLE_RATE]: '50'
    })
    expect(selectSentrySampleRate(state)).toBe(0.5)
  })

  it('selectSentrySampleRate treats "0" as valid (does not fall back to default)', () => {
    const state = stateWithFlags({
      [FeatureVars.SENTRY_SAMPLE_RATE]: '0'
    })
    expect(selectSentrySampleRate(state)).toBe(0)
  })

  it('selectStakeAnnualPercentageYieldBPS returns parsed PostHog value', () => {
    const state = stateWithFlags({
      [FeatureVars.STAKE_APY_BPS]: '999'
    })
    expect(selectStakeAnnualPercentageYieldBPS(state)).toBe(999)
  })

  it('selectFusionFeeUnitsMarginBps treats "0" as valid (does not fall back to default)', () => {
    const state = stateWithFlags({
      [FeatureVars.FUSION_FEE_UNITS_MARGIN_BPS]: '0'
    })
    expect(selectFusionFeeUnitsMarginBps(state)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Numeric selectors — PostHog flag absent (falls back to DefaultFeatureFlagConfig)
// ---------------------------------------------------------------------------

describe('numeric selectors — PostHog flag absent', () => {
  const emptyState = stateWithFlags()

  it('selectFusionFeeUnitsMarginBps falls back to default', () => {
    expect(selectFusionFeeUnitsMarginBps(emptyState)).toBe(
      parseInt(
        DefaultFeatureFlagConfig[FeatureVars.FUSION_FEE_UNITS_MARGIN_BPS]
      )
    )
  })

  it('selectFusionMaxAmountGasSafetyBps falls back to default', () => {
    expect(selectFusionMaxAmountGasSafetyBps(emptyState)).toBe(
      parseInt(
        DefaultFeatureFlagConfig[FeatureVars.FUSION_MAX_AMOUNT_GAS_SAFETY_BPS]
      )
    )
  })

  it('selectFusionTransferGasMarginBps falls back to default', () => {
    expect(selectFusionTransferGasMarginBps(emptyState)).toBe(
      parseInt(
        DefaultFeatureFlagConfig[FeatureVars.FUSION_TRANSFER_GAS_MARGIN_BPS]
      )
    )
  })

  it('selectFusionMaxAmountAdditiveBpsDefault falls back to default', () => {
    expect(selectFusionMaxAmountAdditiveBpsDefault(emptyState)).toBe(
      parseInt(
        DefaultFeatureFlagConfig[
          FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_DEFAULT
        ]
      )
    )
  })

  it('selectFusionMaxAmountAdditiveBpsEvmToSolana falls back to default', () => {
    expect(selectFusionMaxAmountAdditiveBpsEvmToSolana(emptyState)).toBe(
      parseInt(
        DefaultFeatureFlagConfig[
          FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_EVM_TO_SOLANA
        ]
      )
    )
  })

  it('selectFusionMaxAmountAdditiveBpsSolanaToEvm falls back to default', () => {
    expect(selectFusionMaxAmountAdditiveBpsSolanaToEvm(emptyState)).toBe(
      parseInt(
        DefaultFeatureFlagConfig[
          FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_SOLANA_TO_EVM
        ]
      )
    )
  })

  it('selectMarkrSwapMaxRetries falls back to default', () => {
    expect(selectMarkrSwapMaxRetries(emptyState)).toBe(
      parseInt(DefaultFeatureFlagConfig[FeatureVars.MARKR_SWAP_MAX_RETRIES])
    )
  })

  it('selectSentrySampleRate falls back to default divided by 100', () => {
    expect(selectSentrySampleRate(emptyState)).toBe(
      parseInt(DefaultFeatureFlagConfig[FeatureVars.SENTRY_SAMPLE_RATE]) / 100
    )
  })

  it('selectStakeAnnualPercentageYieldBPS falls back to default', () => {
    expect(selectStakeAnnualPercentageYieldBPS(emptyState)).toBe(
      parseInt(DefaultFeatureFlagConfig[FeatureVars.STAKE_APY_BPS])
    )
  })
})

// ---------------------------------------------------------------------------

describe('selectIsSeedlessSigningBlocked', () => {
  it('should return false for non-seedless wallets regardless of flags', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.SEEDLESS_SIGNING]: false
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(false)
  })

  it('should return false for seedless wallet when signing is enabled', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(false)
  })

  it('should return true for seedless wallet when SEEDLESS_SIGNING is off', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: false
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(true)
  })

  it('should return true for seedless wallet when EVERYTHING is off', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: false,
        [FeatureGates.SEEDLESS_SIGNING]: true
      }
    })
    expect(selectIsSeedlessSigningBlocked(state)).toBe(true)
  })
})

describe('selectIsFusionEnabled', () => {
  it('should return true when flag is on and wallet is non-seedless', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(true)
  })

  it('should return false when FUSION is off', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.FUSION]: false
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })

  it('should return false when EVERYTHING is off', () => {
    const state = createMockRootState({
      walletType: WalletType.MNEMONIC,
      featureFlags: {
        [FeatureGates.EVERYTHING]: false,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })

  it('should return false for seedless wallet when seedless signing is blocked', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: false,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })

  it('should return true for seedless wallet when seedless signing is enabled and flag is on', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true,
        [FeatureGates.FUSION]: true
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(true)
  })

  it('should return false for seedless wallet when seedless signing is enabled but flag is off', () => {
    const state = createMockRootState({
      walletType: WalletType.SEEDLESS,
      featureFlags: {
        [FeatureGates.EVERYTHING]: true,
        [FeatureGates.SEEDLESS_SIGNING]: true,
        [FeatureGates.FUSION]: false
      }
    })
    expect(selectIsFusionEnabled(state)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Stake convenience-fee rate selectors (multivariate fee gates)
// ---------------------------------------------------------------------------

describe('selectFastStakeFeeRate / selectDelegationFeeRate', () => {
  it('parses the variant string as basis points', () => {
    const state = stateWithFlags({
      [FeatureGates.FAST_STAKE_FEE_ENABLED]: '1000',
      [FeatureGates.DELEGATION_FEE_ENABLED]: '250'
    })
    expect(selectFastStakeFeeRate(state)).toBe(0.1)
    expect(selectDelegationFeeRate(state)).toBe(0.025)
  })

  it('treats a variant of "0" as a valid zero rate (no fallback)', () => {
    const state = stateWithFlags({
      [FeatureGates.FAST_STAKE_FEE_ENABLED]: '0'
    })
    expect(selectFastStakeFeeRate(state)).toBe(0)
  })

  it('falls back to the 10% default when the gate is a plain boolean', () => {
    const state = stateWithFlags({
      [FeatureGates.FAST_STAKE_FEE_ENABLED]: true,
      [FeatureGates.DELEGATION_FEE_ENABLED]: true
    })
    expect(selectFastStakeFeeRate(state)).toBe(0.1)
    expect(selectDelegationFeeRate(state)).toBe(0.1)
  })

  it('falls back to the 10% default when the flag is absent', () => {
    const state = stateWithFlags({})
    expect(selectFastStakeFeeRate(state)).toBe(0.1)
    expect(selectDelegationFeeRate(state)).toBe(0.1)
  })
})

describe('selectIsFastStakeFeeBlocked / selectIsDelegationFeeBlocked with variants', () => {
  it('reports enabled for a positive-rate variant', () => {
    const state = stateWithFlags({
      [FeatureGates.EVERYTHING]: true,
      [FeatureGates.FAST_STAKE_FEE_ENABLED]: '250',
      [FeatureGates.DELEGATION_FEE_ENABLED]: '1000'
    })
    expect(selectIsFastStakeFeeBlocked(state)).toBe(false)
    expect(selectIsDelegationFeeBlocked(state)).toBe(false)
  })

  it('treats a variant of "0" exactly like the flag being off', () => {
    const state = stateWithFlags({
      [FeatureGates.EVERYTHING]: true,
      [FeatureGates.FAST_STAKE_FEE_ENABLED]: '0',
      [FeatureGates.DELEGATION_FEE_ENABLED]: '0'
    })
    expect(selectIsFastStakeFeeBlocked(state)).toBe(true)
    expect(selectIsDelegationFeeBlocked(state)).toBe(true)
  })

  it('treats a negative-rate misconfiguration as off', () => {
    const state = stateWithFlags({
      [FeatureGates.EVERYTHING]: true,
      [FeatureGates.FAST_STAKE_FEE_ENABLED]: '-100'
    })
    expect(selectIsFastStakeFeeBlocked(state)).toBe(true)
  })

  it('keeps a plain boolean gate enabled (10% fallback is positive)', () => {
    const state = stateWithFlags({
      [FeatureGates.EVERYTHING]: true,
      [FeatureGates.FAST_STAKE_FEE_ENABLED]: true
    })
    expect(selectIsFastStakeFeeBlocked(state)).toBe(false)
  })
})
