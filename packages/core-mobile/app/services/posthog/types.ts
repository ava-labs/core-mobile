import { JsonMap } from 'store/posthog'

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
  DEFI = 'defi-feature',
  BROWSER = 'browser-feature',
  LEFT_FAB = 'left-fab-feature',
  DARK_MODE = 'dark-mode-feature',
  SEEDLESS_ONBOARDING = 'seedless-onboarding',
  SEEDLESS_ONBOARDING_APPLE = 'seedless-onboarding-apple',
  SEEDLESS_ONBOARDING_GOOGLE = 'seedless-onboarding-google',
  SEEDLESS_MFA_YUBIKEY = 'seedless-mfa-yubikey',
  SEEDLESS_MFA_PASSKEY = 'seedless-mfa-passkey',
  SEEDLESS_MFA_AUTHENTICATOR = 'seedless-mfa-authenticator',
  SEEDLESS_SIGNING = 'seedless-signing',
  UNIFIED_BRIDGE_CCTP = 'unified-bridge-cctp',
  LOG_ERRORS_TO_SENTRY = 'log-errors-to-sentry',
  BLOCKAID_TRANSACTION_VALIDATION = 'blockaid-transaction-validation',
  BLOCKAID_DAPP_SCAN = 'blockaid-dapp-scan',
  BALANCE_CHANGE_NOTIFICATIONS = 'balance-change-notifications',
  K2_ALPINE = 'k2-alpine'
}

export enum FeatureVars {
  SENTRY_SAMPLE_RATE = 'sentry-sample-rate'
}

// posthog response can be an empty object when all features are disabled
// thus, we need to use Partial
export type PostHogDecideResponse = {
  featureFlags: Partial<Record<FeatureGates | FeatureVars, boolean | string>>
  featureFlagPayloads: Partial<Record<FeatureGates | FeatureVars, string>>
}

export type FeatureFlags = PostHogDecideResponse['featureFlags']

export type PosthogDeviceInfo = {
  $app_build: string
  $app_name: string
  $app_version: string
  $app_namespace: string
  $device_manufacturer: string
  $device_model: string
  $device_name: string
  $device_type: string
  $locale: string | undefined
  $network_carrier: string
  $os_name: string
  $os_version: string
  $timezone: string
}

export interface PostHogServiceInterface {
  configure({
    distinctId,
    userId
  }: {
    distinctId: string
    userId: string
  }): void

  get isConfigured(): boolean

  capture(eventName: string, properties?: JsonMap): Promise<void>

  identifyUser(distinctId: string): Promise<void>

  fetchFeatureFlags(
    distinctId: string
  ): Promise<
    Partial<Record<FeatureGates | FeatureVars, string | boolean>> | undefined
  >
}
