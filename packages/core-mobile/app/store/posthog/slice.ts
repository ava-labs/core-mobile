import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { v4 as uuidv4 } from 'uuid'
import { FeatureGates, FeatureFlags, FeatureVars } from 'services/posthog/types'
import { WalletType } from 'services/wallet/types'
import { initialState, ProcessedFeatureFlags } from './types'

const reducerName = 'posthog'

export const posthogSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    regenerateUserId: state => {
      state.userID = uuidv4()
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
export const selectRawFeatureFlags = (state: RootState): FeatureFlags =>
  state.posthog.featureFlags
export const selectWalletType = (state: RootState): WalletType =>
  state.app.walletType

const isSeedlessSigningBlocked = (featureFlags: FeatureFlags): boolean => {
  return (
    !featureFlags[FeatureGates.SEEDLESS_SIGNING] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSeedlessSigningBlocked = createSelector(
  [selectRawFeatureFlags, selectWalletType],
  (featureFlags, walletType) => {
    const isSeedlessWallet = walletType === WalletType.SEEDLESS

    if (!isSeedlessWallet) {
      return false
    }

    return isSeedlessSigningBlocked(featureFlags)
  }
)

export const selectIsSwapBlocked = createSelector(
  [selectRawFeatureFlags, selectWalletType],
  (featureFlags, walletType) => {
    const isSeedlessWallet = walletType === WalletType.SEEDLESS

    if (isSeedlessWallet) {
      return isSeedlessSigningBlocked(featureFlags)
    }

    return (
      !featureFlags[FeatureGates.SWAP] || !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsBridgeBlocked = createSelector(
  [selectRawFeatureFlags, selectWalletType],
  (featureFlags, walletType) => {
    const isSeedlessWallet = walletType === WalletType.SEEDLESS

    if (isSeedlessWallet) {
      return isSeedlessSigningBlocked(featureFlags)
    }

    return (
      !featureFlags[FeatureGates.BRIDGE] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsBridgeBtcBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.BRIDGE_BTC] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsBridgeEthBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.BRIDGE_ETH] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSendBlocked = createSelector(
  [selectRawFeatureFlags, selectWalletType],
  (featureFlags, walletType) => {
    const isSeedlessWallet = walletType === WalletType.SEEDLESS

    if (isSeedlessWallet) {
      return isSeedlessSigningBlocked(featureFlags)
    }

    return (
      !featureFlags[FeatureGates.SEND] || !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsEarnBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.EARN] || !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsNotificationBlocked = createSelector(
  [selectIsEarnBlocked],
  isEarnBlocked => {
    // in the future, other feature required notifications should go here
    return isEarnBlocked
  }
)

export const selectIsSendNftBlockediOS = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.SEND_NFT_IOS] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSendNftBlockedAndroid = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.SEND_NFT_ANDROID] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsEventsBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.EVENTS] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsCoinbasePayBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.BUY_COINBASE_PAY] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsBrowserBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.BROWSER] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsDeFiBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.DEFI] || !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectSentrySampleRate = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      parseInt(
        (featureFlags[FeatureVars.SENTRY_SAMPLE_RATE] as string) ?? '0'
      ) / 100
    )
  }
)

export const selectUseLeftFab = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      Boolean(featureFlags[FeatureGates.LEFT_FAB]) ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectUseDarkMode = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      Boolean(featureFlags[FeatureGates.DARK_MODE]) ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSeedlessOnboardingBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      (!featureFlags[FeatureGates.SEEDLESS_ONBOARDING_APPLE] &&
        !featureFlags[FeatureGates.SEEDLESS_ONBOARDING_GOOGLE]) ||
      !featureFlags[FeatureGates.SEEDLESS_ONBOARDING] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSeedlessOnboardingAppleBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.SEEDLESS_ONBOARDING_APPLE] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSeedlessOnboardingGoogleBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.SEEDLESS_ONBOARDING_GOOGLE] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSeedlessMfaPasskeyBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.SEEDLESS_MFA_PASSKEY] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSeedlessMfaAuthenticatorBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.SEEDLESS_MFA_AUTHENTICATOR] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsSeedlessMfaYubikeyBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.SEEDLESS_MFA_YUBIKEY] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsUnifiedBridgeCCTPBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.UNIFIED_BRIDGE_CCTP] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsLogErrorsWithSentryBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.LOG_ERRORS_TO_SENTRY] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectIsBlockaidTransactionValidationBlocked = createSelector(
  [selectRawFeatureFlags],
  featureFlags => {
    return (
      !featureFlags[FeatureGates.BLOCKAID_TRANSACTION_VALIDATION] ||
      !featureFlags[FeatureGates.EVERYTHING]
    )
  }
)

export const selectFeatureFlags = createSelector(
  [
    selectIsSwapBlocked,
    selectIsBridgeBlocked,
    selectIsBridgeBtcBlocked,
    selectIsBridgeEthBlocked,
    selectIsEarnBlocked,
    selectIsSendBlocked,
    selectIsSendNftBlockediOS,
    selectIsSendNftBlockedAndroid,
    selectIsEventsBlocked,
    selectSentrySampleRate,
    selectIsCoinbasePayBlocked,
    selectIsDeFiBlocked,
    selectUseLeftFab,
    selectUseDarkMode
  ],
  (
    swapBlocked,
    bridgeBlocked,
    bridgeBtcBlocked,
    bridgeEthBlocked,
    earnBlocked,
    sendBlocked,
    sendNftBlockediOS,
    sendNftBlockedAndroid,
    eventsBlocked,
    sentrySampleRate,
    coinbasePayBlocked,
    defiBlocked,
    leftFab,
    darkMode
    // eslint-disable-next-line max-params
  ): ProcessedFeatureFlags => {
    return {
      swapBlocked,
      bridgeBlocked,
      bridgeBtcBlocked,
      bridgeEthBlocked,
      earnBlocked,
      sendBlocked,
      sendNftBlockediOS,
      sendNftBlockedAndroid,
      eventsBlocked,
      sentrySampleRate,
      coinbasePayBlocked,
      defiBlocked,
      leftFab,
      darkMode
    }
  }
)

// actions
export const { regenerateUserId, toggleAnalytics, setFeatureFlags } =
  posthogSlice.actions

export const posthogReducer = posthogSlice.reducer
