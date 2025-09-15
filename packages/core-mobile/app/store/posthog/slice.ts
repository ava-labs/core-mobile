import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { FeatureGates, FeatureFlags, FeatureVars } from 'services/posthog/types'
import { WalletType } from 'services/wallet/types'
import { uuid } from 'utils/uuid'
import { initialState } from './types'

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

export const selectIsSwapBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  const isSeedlessWallet = state.app.walletType === WalletType.SEEDLESS

  if (isSeedlessWallet) {
    return isSeedlessSigningBlocked(featureFlags)
  }

  return (
    !featureFlags[FeatureGates.SWAP] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsBridgeBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  const isSeedlessWallet = state.app.walletType === WalletType.SEEDLESS

  if (isSeedlessWallet) {
    return isSeedlessSigningBlocked(featureFlags)
  }

  return (
    !featureFlags[FeatureGates.BRIDGE] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsBridgeBtcBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BRIDGE_BTC] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsBridgeEthBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BRIDGE_ETH] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSendBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog

  const isSeedlessWallet = state.app.walletType === WalletType.SEEDLESS

  if (isSeedlessWallet) {
    return isSeedlessSigningBlocked(featureFlags)
  }

  return (
    !featureFlags[FeatureGates.SEND] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsEarnBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.EARN] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSendNftBlockediOS = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEND_NFT_IOS] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSendNftBlockedAndroid = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEND_NFT_ANDROID] ||
    !featureFlags[FeatureGates.EVERYTHING]
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

export const selectIsBrowserBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BROWSER] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsDeFiBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.DEFI] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectSentrySampleRate = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return (
    parseInt((featureFlags[FeatureVars.SENTRY_SAMPLE_RATE] as string) ?? '0') /
    100
  )
}

export const selectPFeeAdjustmentThreshold = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseFloat(
    featureFlags[FeatureVars.P_FEE_ADJUSTMENT_THRESHOLD] as string
  )
}

export const selectCrossChainFeesMultiplier = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseFloat(
    featureFlags[FeatureVars.CROSS_CHAIN_FEES_MULTIPLIER] as string
  )
}

export const selectCBaseFeeMultiplier = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseFloat(featureFlags[FeatureVars.C_BASE_FEE_MULTIPLIER] as string)
}

export const selectUseLeftFab = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    Boolean(featureFlags[FeatureGates.LEFT_FAB]) ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectUseDarkMode = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    Boolean(featureFlags[FeatureGates.DARK_MODE]) ||
    !featureFlags[FeatureGates.EVERYTHING]
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

export const selectIsBlockaidTransactionValidationBlocked = (
  state: RootState
): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BLOCKAID_TRANSACTION_VALIDATION] ||
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

export const selectIsSwapFeesBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SWAP_FEES] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSolanaSupportBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
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

export const selectIsSwapUseMarkrBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SWAP_USE_MARKR] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectMarkrSwapGasBuffer = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseFloat(featureFlags[FeatureVars.MARKR_SWAP_GAS_BUFFER] as string)
}

export const selectMarkrSwapMaxRetries = (state: RootState): number => {
  const { featureFlags } = state.posthog
  return parseInt(featureFlags[FeatureVars.MARKR_SWAP_MAX_RETRIES] as string)
}

export const selectIsSwapFeesJupiterBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SWAP_FEES_JUPITER] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSolanaSwapBlocked = (state: RootState): boolean => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SWAP_SOLANA] ||
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
  return parseInt(featureFlags[FeatureVars.STAKE_APY_BPS] as string)
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

// actions
export const { regenerateUserId, toggleAnalytics, setFeatureFlags } =
  posthogSlice.actions

export const posthogReducer = posthogSlice.reducer
