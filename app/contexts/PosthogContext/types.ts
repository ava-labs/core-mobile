import { JsonMap } from 'posthog-react-native/src/bridge'
import { TransactionName } from 'services/sentry/types'

export enum FeatureGates {
  EVERYTHING = 'everything',
  EVENTS = 'events',
  SWAP = 'swap-feature',
  BRIDGE = 'bridge-feature',
  BRIDGE_BTC = 'bridge-feature-btc',
  BRIDGE_ETH = 'bridge-feature-eth',
  SEND = 'send-feature',
  SEND_NFT_IOS = 'send-nft-ios-feature',
  SEND_NFT_ANDROID = 'send-nft-android-feature',
  USE_FLATLIST_ANDROID = 'use-flatlist-android'
}

export enum FeatureVars {
  SENTRY_SAMPLE_RATE = 'sentry-sample-rate'
}

export const SENTRY_SAMPLE_RATE_PREFIX = 'sentry-sample-rate_'

type SentrySampleRateFlag = `sentry-sample-rate_${TransactionName}`

export function requireSentryFlag(
  input: string
): asserts input is SentrySampleRateFlag {
  if (input.startsWith(SENTRY_SAMPLE_RATE_PREFIX))
    throw new Error('not sentry flag')
}

export function getSentryTransactionName(
  input: SentrySampleRateFlag
): TransactionName {
  return input.substring(SENTRY_SAMPLE_RATE_PREFIX.length) as TransactionName
}

export type PosthogCapture = (
  event: string,
  properties?: JsonMap
) => Promise<void>

// posthog response can be an empty object when all features are disabled
// thus, we need to use Partial
export type PostHogDecideResponse = {
  featureFlags: Partial<
    Record<FeatureGates | FeatureVars | SentrySampleRateFlag, boolean | string>
  >
}

export type FeatureFlags = PostHogDecideResponse['featureFlags']
