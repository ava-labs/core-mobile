import { v4 as uuidv4 } from 'uuid'

export enum FeatureGates {
  EVERYTHING = 'everything',
  EVENTS = 'events',
  SWAP = 'swap-feature',
  BRIDGE = 'bridge-feature',
  BRIDGE_BTC = 'bridge-feature-btc',
  BRIDGE_ETH = 'bridge-feature-eth',
  EARN = 'earn-feature',
  SEND = 'send-feature',
  SEND_NFT_IOS = 'send-nft-ios-feature',
  SEND_NFT_ANDROID = 'send-nft-android-feature',
  BUY_COINBASE_PAY = 'buy-feature-coinbase',
  USE_COINGECKO_PRO = 'use-coingecko-pro'
}

export enum FeatureVars {
  SENTRY_SAMPLE_RATE = 'sentry-sample-rate'
}

// posthog response can be an empty object when all features are disabled
// thus, we need to use Partial
export type PostHogDecideResponse = {
  featureFlags: Partial<Record<FeatureGates | FeatureVars, boolean | string>>
}

export type FeatureFlags = PostHogDecideResponse['featureFlags']

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
  [FeatureGates.USE_COINGECKO_PRO]: false
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
