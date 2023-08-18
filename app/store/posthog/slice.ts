import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { v4 as uuidv4 } from 'uuid'
import { FeatureGates, FeatureFlags, FeatureVars } from 'services/posthog/types'
import { initialState, JsonMap } from './types'

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
export const selectUserID = (state: RootState) => state.posthog.userID
export const selectDistinctID = (state: RootState) => state.posthog.distinctID
export const selectIsAnalyticsEnabled = (state: RootState) =>
  state.posthog.isAnalyticsEnabled

export const selectIsSwapBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SWAP] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsBridgeBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BRIDGE] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsBridgeBtcBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BRIDGE_BTC] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsBridgeEthBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BRIDGE_ETH] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSendBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEND] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsEarnBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.EARN] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSendNftBlockediOS = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEND_NFT_IOS] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsSendNftBlockedAndroid = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.SEND_NFT_ANDROID] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsEventsBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.EVENTS] || !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectIsCoinbasePayBlocked = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    !featureFlags[FeatureGates.BUY_COINBASE_PAY] ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectUseCoinGeckoPro = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    Boolean(featureFlags[FeatureGates.USE_COINGECKO_PRO]) ||
    !featureFlags[FeatureGates.EVERYTHING]
  )
}

export const selectSentrySampleRate = (state: RootState) => {
  const { featureFlags } = state.posthog
  return (
    parseInt((featureFlags[FeatureVars.SENTRY_SAMPLE_RATE] as string) ?? '0') /
    100
  )
}

// actions
export const { regenerateUserId, toggleAnalytics, setFeatureFlags } =
  posthogSlice.actions
export const capture = createAction<{ event: string; properties?: JsonMap }>(
  `${reducerName}/capture`
)

export const posthogReducer = posthogSlice.reducer
