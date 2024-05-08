import { FeatureFlags, FeatureGates, FeatureVars } from 'services/posthog/types'
import { v4 as uuidv4 } from 'uuid'

export const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.BRIDGE_BTC]: true,
  [FeatureGates.BRIDGE_ETH]: true,
  [FeatureGates.EARN]: false,
  [FeatureGates.SEND]: true,
  [FeatureGates.SEND_NFT_IOS]: true,
  [FeatureGates.SEND_NFT_ANDROID]: true,
  [FeatureVars.SENTRY_SAMPLE_RATE]: '10', // 10% of events/errors
  [FeatureGates.BUY_COINBASE_PAY]: true,
  [FeatureGates.DEFI]: true,
  [FeatureGates.BROWSER]: false,
  [FeatureGates.LEFT_FAB]: false,
  [FeatureGates.DARK_MODE]: false,
  [FeatureGates.SEEDLESS_ONBOARDING]: true,
  [FeatureGates.SEEDLESS_ONBOARDING_GOOGLE]: true,
  [FeatureGates.SEEDLESS_ONBOARDING_APPLE]: true,
  [FeatureGates.SEEDLESS_MFA_PASSKEY]: true,
  [FeatureGates.SEEDLESS_MFA_AUTHENTICATOR]: true,
  [FeatureGates.SEEDLESS_MFA_YUBIKEY]: true,
  [FeatureGates.SEEDLESS_SIGNING]: true,
  [FeatureGates.BLOCKAID_TRANSACTION_VALIDATION]: true
}

export const initialState = {
  userID: uuidv4(),
  distinctID: uuidv4(),
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
