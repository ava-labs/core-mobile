import { FeatureFlags, FeatureGates, FeatureVars } from 'services/posthog/types'
import { uuid } from 'utils/uuid'

export const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.BRIDGE_BTC]: true,
  [FeatureGates.BRIDGE_ETH]: true,
  [FeatureGates.EARN]: true,
  [FeatureGates.SEND]: true,
  [FeatureGates.SEND_NFT_IOS]: true,
  [FeatureGates.SEND_NFT_ANDROID]: true,
  [FeatureVars.SENTRY_SAMPLE_RATE]: '10', // 10% of events/errors
  [FeatureVars.P_FEE_ADJUSTMENT_THRESHOLD]: '1e-3', // 0.1%
  [FeatureVars.P_FEE_MULTIPLIER]: '2e-1', // 20%
  [FeatureVars.CROSS_CHAIN_FEES_MULTIPLIER]: '4e0', // 400%
  [FeatureVars.C_BASE_FEE_MULTIPLIER]: '1e0', // 100%
  [FeatureGates.BUY_COINBASE_PAY]: true,
  [FeatureGates.DEFI]: true,
  [FeatureGates.BROWSER]: true,
  [FeatureGates.LEFT_FAB]: false,
  [FeatureGates.DARK_MODE]: false,
  [FeatureGates.SEEDLESS_ONBOARDING]: true,
  [FeatureGates.SEEDLESS_ONBOARDING_GOOGLE]: true,
  [FeatureGates.SEEDLESS_ONBOARDING_APPLE]: true,
  [FeatureGates.SEEDLESS_MFA_PASSKEY]: true,
  [FeatureGates.SEEDLESS_MFA_AUTHENTICATOR]: true,
  [FeatureGates.SEEDLESS_MFA_YUBIKEY]: true,
  [FeatureGates.SEEDLESS_SIGNING]: true,
  [FeatureGates.BLOCKAID_TRANSACTION_VALIDATION]: true,
  [FeatureGates.BLOCKAID_DAPP_SCAN]: true,
  [FeatureGates.ALL_NOTIFICATIONS]: true,
  [FeatureGates.UNIFIED_BRIDGE_CCTP]: true,
  [FeatureGates.UNIFIED_BRIDGE_ICTT]: true,
  [FeatureGates.UNIFIED_BRIDGE_AB_EVM]: true,
  [FeatureGates.UNIFIED_BRIDGE_AB_AVA_TO_BTC]: true,
  [FeatureGates.UNIFIED_BRIDGE_AB_BTC_TO_AVA]: true,
  [FeatureGates.HALLIDAY_BRIDGE_BANNER]: true
}

export const initialState = {
  userID: uuid(),
  distinctID: uuid(),
  isAnalyticsEnabled: false,
  featureFlags: DefaultFeatureFlagConfig
} as PosthogState

export type PosthogState = {
  userID: string
  distinctID: string
  isAnalyticsEnabled: boolean
  featureFlags: FeatureFlags
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonList extends Array<JsonValue> {}

export type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonList
  | JsonMap
  | undefined
export interface JsonMap {
  [key: string]: JsonValue
  [index: number]: JsonValue
}

export type ProcessedFeatureFlags = {
  swapBlocked: boolean
  bridgeBlocked: boolean
  bridgeBtcBlocked: boolean
  bridgeEthBlocked: boolean
  earnBlocked: boolean
  sendBlocked: boolean
  sendNftBlockediOS: boolean
  sendNftBlockedAndroid: boolean
  sentrySampleRate: number
  coinbasePayBlocked: boolean
  defiBlocked: boolean
  leftFab: boolean
  darkMode: boolean
  eventsBlocked: boolean
}
