import { JsonMap } from 'posthog-react-native/src/bridge'

export enum FeatureGates {
  EVERYTHING = 'everything',
  EVENTS = 'events',
  SWAP = 'swap-feature',
  BRIDGE = 'bridge-feature',
  BRIDGE_BTC = 'bridge-feature-btc',
  BRIDGE_ETH = 'bridge-feature-eth',
  SEND = 'send-feature',
  SEND_NFT = 'send-nft-feature'
}

export enum FeatureVars {
  SENTRY_SAMPLE_RATE = 'sentry-sample-rate'
}

export type PosthogCapture = (
  event: string,
  properties?: JsonMap
) => Promise<void>
