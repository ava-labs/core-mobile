import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { FeatureGates, FeatureFlags, FeatureVars } from 'services/posthog/types'
import { WalletType } from 'services/wallet/types'
import { uuid } from 'utils/uuid'
import { selectActiveWallet } from 'store/wallet/slice'
import { selectCoreAnalyticsConsent } from 'store/settings/securityPrivacy'
import { initialState, DefaultFeatureFlagConfig } from './types'

const reducerName = 'posthog'

export const posthogSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    regenerateUserId: state => {
      state.userID = uuid()
    },
    toggleAnalytics: (state, action: PayloadAction<boolean>) => {
      const value = action.payload
      state.isAnalyticsEnabled = value
    },
    setFeatureFlags: (state, action: PayloadAction<FeatureFlags>) => {
      state.featureFlags = action.payload
    }
  }
})

// selectors
export const selectUserID = (state: RootState): string => state.posthog.userID
export const selectDistinctID = (state: RootState): string =>
  state.posthog.distinctID
export const selectIsAnalyticsEnabled = (state: RootState): boolean =>
  state.posthog.isAnalyticsEnabled

const isSeedlessSigningBlocked = (featureFlags: FeatureFlags): boolean => {
  return (
    !featureFlags[FeatureGates.SEEDLESS_SIGNING] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSeedlessSigningBlocked = (state: RootState): boolean => {
  const isSeedlessWallet = state.app.walletType === WalletType.SEEDLESS

  if (!isSeedlessWallet) {
    return false
  }

  return isSeedlessSigningBlocked(state.posthog.featureFlags)
}

export const selectIsEarnBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.EARN] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsEventsBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.EVENTS] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsCoinbasePayBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BUY_COINBASE_PAY] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsPriceChartBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.PRICE_CHART] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

/**
 * Parses a PostHog feature-var string as an integer.
 * Falls back to the compiled-in default only when the flag is absent (NaN).
 * A PostHog value of "0" is treated as a valid zero — it does NOT fall back.
 */
const parseIntFlag = (raw: unknown, fallback: string): number => {
  const n = parseInt(raw as string)
  return Number.isNaN(n) ? parseInt(fallback) : n
}

/**
 * Parses a PostHog feature-var string as a float.
 * Falls back to the compiled-in default only when the flag is absent (NaN).
 * A PostHog value of "0" is treated as a valid zero — it does NOT fall back.
 */
const parseFloatFlag = (raw: unknown, fallback: string): number => {
  const n = parseFloat(raw as string)
  return Number.isNaN(n) ? parseFloat(fallback) : n
}

// 3-state override for the optimistic-confirmation gate. Mirrors the
// `sae-override` flag in core-extension. `auto` (or any unrecognized value)
// defers to the InfoAPI Helicon check.
export type SaeOverride = 'auto' | 'enabled' | 'disabled'

export const selectSaeOverride = (state: RootState): SaeOverride => {
  const value = state.posthog.featureFlags[FeatureVars.SAE_OVERRIDE]
  if (value === 'enabled' || value === 'disabled') return value
  return 'auto'
}

export const selectSentrySampleRate = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return (
    parseIntFlag(
      featureFlags[FeatureVars.SENTRY_SAMPLE_RATE],
      DefaultFeatureFlagConfig[FeatureVars.SENTRY_SAMPLE_RATE]
    ) / 100
  )
}

export const selectPFeeAdjustmentThreshold = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseFloatFlag(
    featureFlags[FeatureVars.P_FEE_ADJUSTMENT_THRESHOLD],
    DefaultFeatureFlagConfig[FeatureVars.P_FEE_ADJUSTMENT_THRESHOLD]
  )
}

export const selectCrossChainFeesMultiplier = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseFloatFlag(
    featureFlags[FeatureVars.CROSS_CHAIN_FEES_MULTIPLIER],
    DefaultFeatureFlagConfig[FeatureVars.CROSS_CHAIN_FEES_MULTIPLIER]
  )
}

export const selectCBaseFeeMultiplier = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseFloatFlag(
    featureFlags[FeatureVars.C_BASE_FEE_MULTIPLIER],
    DefaultFeatureFlagConfig[FeatureVars.C_BASE_FEE_MULTIPLIER]
  )
}

export const selectIsSeedlessOnboardingBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    (!featureFlags[FeatureGates.SEEDLESS_ONBOARDING_APPLE] &&
      !featureFlags[FeatureGates.SEEDLESS_ONBOARDING_GOOGLE]) ||
    !featureFlags[FeatureGates.SEEDLESS_ONBOARDING] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSeedlessOnboardingAppleBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEEDLESS_ONBOARDING_APPLE] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSeedlessOnboardingGoogleBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEEDLESS_ONBOARDING_GOOGLE] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSeedlessMfaPasskeyBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEEDLESS_MFA_PASSKEY] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSeedlessMfaAuthenticatorBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEEDLESS_MFA_AUTHENTICATOR] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSeedlessMfaYubikeyBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEEDLESS_MFA_YUBIKEY] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsFeatureBlocked = (
  state: RootState,
  feature: FeatureGates
): boolean => {
  const { featureFlags } = state.posthog
  return !featureFlags[feature] || !featureFlags[FeatureGates.EVERYTHING]
}

export const selectIsLogErrorsWithSentryBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.LOG_ERRORS_TO_SENTRY] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsBlockaidDappScanBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BLOCKAID_DAPP_SCAN] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsAllNotificationsBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.ALL_NOTIFICATIONS] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsEnableNotificationPromptBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.ENABLE_NOTIFICATION_PROMPT] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsHallidayBridgeBannerBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.HALLIDAY_BRIDGE_BANNER] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsGaslessBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.GASLESS] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSolanaSupportBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  const activeWallet = selectActiveWallet(state)
  if (activeWallet?.type === WalletType.KEYSTONE) {
    return true
  }

  return (
    !featureFlags[FeatureGates.SOLANA_SUPPORT] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsMeldOnrampBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.MELD_ONRAMP] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsMeldOfframpBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.MELD_OFFRAMP] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsKeystoneBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.KEYSTONE] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectFusionFeeUnitsMarginBps = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.FUSION_FEE_UNITS_MARGIN_BPS],
    DefaultFeatureFlagConfig[FeatureVars.FUSION_FEE_UNITS_MARGIN_BPS]
  )
}

export const selectFusionMaxAmountGasSafetyBps = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.FUSION_MAX_AMOUNT_GAS_SAFETY_BPS],
    DefaultFeatureFlagConfig[FeatureVars.FUSION_MAX_AMOUNT_GAS_SAFETY_BPS]
  )
}

export const selectFusionTransferGasMarginBps = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.FUSION_TRANSFER_GAS_MARGIN_BPS],
    DefaultFeatureFlagConfig[FeatureVars.FUSION_TRANSFER_GAS_MARGIN_BPS]
  )
}

export const selectFusionMaxAmountAdditiveBpsDefault = (
  state: RootState
): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_DEFAULT],
    DefaultFeatureFlagConfig[FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_DEFAULT]
  )
}

export const selectFusionMaxAmountAdditiveBpsEvmToSolana = (
  state: RootState
): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_EVM_TO_SOLANA],
    DefaultFeatureFlagConfig[
      FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_EVM_TO_SOLANA
    ]
  )
}

export const selectFusionMaxAmountAdditiveBpsSolanaToEvm = (
  state: RootState
): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_SOLANA_TO_EVM],
    DefaultFeatureFlagConfig[
      FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_SOLANA_TO_EVM
    ]
  )
}

export const selectFusionDisableCrossChainSwaps = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return !!featureFlags[FeatureGates.FUSION_DISABLE_CROSS_CHAIN_SWAPS]
}

export const selectMarkrSwapMaxRetries = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.MARKR_SWAP_MAX_RETRIES],
    DefaultFeatureFlagConfig[FeatureVars.MARKR_SWAP_MAX_RETRIES]
  )
}

export const selectIsSolanaSwapBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  return (
    !featureFlags[FeatureGates.SWAP_SOLANA] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsRecurringSwapsBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  return (
    !featureFlags[FeatureGates.SWAP_RECURRING] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsLedgerSupportBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.LEDGER_SUPPORT] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectStakeAnnualPercentageYieldBPS = (
  state: RootState
): number => {
  const { featureFlags } = state.posthog
  return parseIntFlag(
    featureFlags[FeatureVars.STAKE_APY_BPS],
    DefaultFeatureFlagConfig[FeatureVars.STAKE_APY_BPS]
  )
}

export const selectIsInAppUpdateAndroidBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.IN_APP_UPDATE_ANDROID] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsEnableMeldSandboxBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.ENABLE_MELD_SANDBOX] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSolanaLaunchModalBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SOLANA_LAUNCH_MODAL] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsInAppDefiBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.IN_APP_DEFI] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsInAppReviewBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.IN_APP_REVIEW] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsGaslessInstantBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.GASLESS_INSTANT] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

// Returns true if Nest Egg is completely blocked (neither flag is enabled)
export const selectIsNestEggCampaignBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  if (featureFlags[FeatureGates.EVERYTHING] !== true) {
    return true
  }

  // Blocked only if BOTH flags are off
  return (
    featureFlags[FeatureGates.NEST_EGG_CAMPAIGN] !== true &&
    featureFlags[FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY] !== true
  )
}

// Returns true if Nest Egg is restricted to new seedless users only
// This flag works independently - when ON, only new seedless users are eligible
export const selectIsNestEggNewSeedlessOnly = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  return (
    featureFlags[FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

// Returns true if Nest Egg campaign is active for all seedless users
export const selectIsNestEggCampaignActive = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  return (
    featureFlags[FeatureGates.NEST_EGG_CAMPAIGN] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

// Returns true if user is eligible to qualify for Nest Egg via swap
// Seedless wallets only
// User must have opted into "Unlock airdrops" during onboarding
export const selectIsNestEggEligible = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  const isSeedlessWallet = state.app.walletType === WalletType.SEEDLESS
  const hasOptedIntoAirdrops = selectCoreAnalyticsConsent(state) === true

  // Must be seedless wallet AND have opted into airdrops
  if (
    !isSeedlessWallet ||
    !hasOptedIntoAirdrops ||
    featureFlags[FeatureGates.EVERYTHING] !== true
  ) {
    return false
  }

  // If nest-egg-campaign is ON, ALL seedless users are eligible
  if (featureFlags[FeatureGates.NEST_EGG_CAMPAIGN] === true) {
    return true
  }

  // If nest-egg-new-seedless-only is ON, only NEW seedless users are eligible
  // A user is considered "new" if:
  // - isNewSeedlessUser is true (still in onboarding flow), OR
  // - hasSeenCampaign is true (was shown the modal as a new user)
  if (featureFlags[FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY] === true) {
    const isNewUser = state.nestEgg.isNewSeedlessUser
    const hasSeenCampaign = state.nestEgg.hasSeenCampaign
    return isNewUser || hasSeenCampaign
  }

  return false
}

export const selectIsFusionEnabled = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  const isSeedlessWallet = state.app.walletType === WalletType.SEEDLESS
  if (isSeedlessWallet && isSeedlessSigningBlocked(featureFlags)) {
    return false
  }
  return (
    featureFlags[FeatureGates.FUSION] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

export const selectIsFusionMarkrEnabled = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    featureFlags[FeatureGates.FUSION_MARKR] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

export const selectIsFusionAvalancheEvmEnabled = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    featureFlags[FeatureGates.FUSION_AVALANCHE_EVM] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

export const selectIsFusionAvalancheCctEnabled = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    featureFlags[FeatureGates.FUSION_AVALANCHE_CCT] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

export const selectIsFusionLombardBtcToBtcbEnabled = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    featureFlags[FeatureGates.FUSION_LOMBARD_BTC_TO_BTCB] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

export const selectIsFusionLombardBtcbToBtcEnabled = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    featureFlags[FeatureGates.FUSION_LOMBARD_BTCB_TO_BTC] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

export const selectIsQuickSwapsAvailable = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    featureFlags[FeatureGates.FUSION_QUICK_SWAPS] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

export const selectIsFilterSmallUtxosAvailable = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    featureFlags[FeatureGates.FILTER_SMALL_UTXOS] === true &&
    featureFlags[FeatureGates.EVERYTHING] === true
  )
}

// Composed selector — true when ANY feature on the Advanced Settings
// screen is available. Drives the entry-row visibility on Account
// Settings. Add new flags here as features are added to the Advanced
// screen so the entry doesn't disappear when one specific flag flips off.
export const selectIsAdvancedSettingsAvailable = (state: RootState): boolean =>
  selectIsQuickSwapsAvailable(state) || selectIsFilterSmallUtxosAvailable(state)

export const selectIsAlternateAppIconsBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.ALTERNATE_APP_ICONS] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsInjectedProviderBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.INJECTED_PROVIDER] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsPredictionsBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.PREDICTIONS] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsPerpetualsBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.PERPETUALS] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsFastStakeBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.FAST_STAKE_ENABLED] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

// The two fee gates are multivariate: their variant string carries the
// convenience-fee rate in basis points (e.g. '1000' = 10%), so the same flag
// both enables the fee and tunes its rate without a release. There is no
// compiled-in rate on purpose — a gate served as a plain boolean `true` (no
// variant) or with an unparsable variant yields 0, which
// `selectIs*FeeBlocked` treats as off. Charging a fee always requires an
// explicit rate from PostHog.
const BPS_PER_UNIT = 10_000

// Strict integer parse for the fee-rate variants — deliberately NOT
// `parseIntFlag`, whose `parseInt` accepts partially numeric strings
// ('1000abc' → 1000). This value charges users, so anything that isn't a
// pure digit string reads as 0 and the fee stays off, and the result is
// capped at 10,000 bps (100% of the reward) so no misconfigured variant can
// ever charge more than the reward itself.
const parseBpsFlag = (raw: unknown): number =>
  typeof raw === 'string' && /^\d+$/.test(raw)
    ? Math.min(parseInt(raw, 10), BPS_PER_UNIT)
    : 0

export const selectFastStakeFeeRate = (state: RootState): number =>
  parseBpsFlag(
    state.posthog.featureFlags[FeatureGates.FAST_STAKE_FEE_ENABLED]
  ) / BPS_PER_UNIT

export const selectDelegationFeeRate = (state: RootState): number =>
  parseBpsFlag(
    state.posthog.featureFlags[FeatureGates.DELEGATION_FEE_ENABLED]
  ) / BPS_PER_UNIT

export const selectIsFastStakeFeeBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.FAST_STAKE_FEE_ENABLED] ||
    !featureFlags[FeatureGates.EVERYTHING] ||
    // No positive rate, no fee: a '0' variant, a negative misconfiguration,
    // a plain boolean gate, or an unparsable variant all report as blocked
    // outright, so the flows take the fee-off path instead of advertising a
    // 0% fee and holding the CTA on the reward estimate for a fee that
    // never materialises.
    selectFastStakeFeeRate(state) <= 0
  )
}

export const selectIsDelegationFeeBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.DELEGATION_FEE_ENABLED] ||
    !featureFlags[FeatureGates.EVERYTHING] ||
    // Same zero-rate treatment as `selectIsFastStakeFeeBlocked`.
    selectDelegationFeeRate(state) <= 0
  )
}

// actions
export const { regenerateUserId, toggleAnalytics, setFeatureFlags } =
  posthogSlice.actions

export const posthogReducer = posthogSlice.reducer
