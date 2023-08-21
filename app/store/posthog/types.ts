import { FeatureFlags, FeatureGates, FeatureVars } from 'services/posthog/types'
import { v4 as uuidv4 } from 'uuid'

const DefaultFeatureFlagConfig = {
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
  [FeatureGates.USE_COINGECKO_PRO]: true
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

export type JsonValue = boolean | number | string | null | JsonList | JsonMap
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
  useCoinGeckoPro: boolean
}
