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
  USE_COINGECKO_PRO = 'use-coingecko-pro',
  DEFI = 'defi-feature',
  LEFT_FAB = 'left-fab-feature',
  DARK_MODE = 'dark-mode-feature'
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
