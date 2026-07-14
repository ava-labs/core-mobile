import { JsonMap } from 'store/posthog'

export enum FeatureGates {
  EVERYTHING = 'everything',
  EVENTS = 'events',
  EARN = 'earn-feature',
  BUY_COINBASE_PAY = 'buy-feature-coinbase',
  SEEDLESS_ONBOARDING = 'seedless-onboarding',
  SEEDLESS_ONBOARDING_APPLE = 'seedless-onboarding-apple',
  SEEDLESS_ONBOARDING_GOOGLE = 'seedless-onboarding-google',
  SEEDLESS_MFA_YUBIKEY = 'seedless-mfa-yubikey',
  SEEDLESS_MFA_PASSKEY = 'seedless-mfa-passkey',
  SEEDLESS_MFA_AUTHENTICATOR = 'seedless-mfa-authenticator',
  SEEDLESS_SIGNING = 'seedless-signing',
  LOG_ERRORS_TO_SENTRY = 'log-errors-to-sentry',
  BLOCKAID_DAPP_SCAN = 'blockaid-dapp-scan',
  ALL_NOTIFICATIONS = 'all-notifications',
  ENABLE_NOTIFICATION_PROMPT = 'enable-notification-prompt',
  HALLIDAY_BRIDGE_BANNER = 'halliday-bridge-banner',
  GASLESS = 'gasless-feature',
  SOLANA_SUPPORT = 'solana-support',
  SOLANA_LAUNCH_MODAL = 'solana-launch-modal',
  MELD_ONRAMP = 'meld-onramp',
  MELD_OFFRAMP = 'meld-offramp',
  KEYSTONE = 'keystone',
  SWAP_SOLANA = 'swap-solana',
  IN_APP_UPDATE_ANDROID = 'in-app-update-android',
  ENABLE_MELD_SANDBOX = 'enable-meld-sandbox',
  LEDGER_SUPPORT = 'ledger-support',
  IN_APP_DEFI = 'in-app-defi',
  IN_APP_REVIEW = 'in-app-review',
  GASLESS_INSTANT = 'gasless-instant',
  NEST_EGG_CAMPAIGN = 'nest-egg-campaign',
  NEST_EGG_NEW_SEEDLESS_ONLY = 'nest-egg-new-seedless-only',
  FUSION = 'fusion',
  FUSION_MARKR = 'fusion-markr',
  FUSION_AVALANCHE_EVM = 'fusion-avalanche-evm',
  FUSION_AVALANCHE_CCT = 'fusion-avalanche-cct',
  FUSION_LOMBARD_BTC_TO_BTCB = 'fusion-lombard-btc-to-btcb',
  FUSION_LOMBARD_BTCB_TO_BTC = 'fusion-lombard-btcb-to-btc',
  FUSION_DISABLE_CROSS_CHAIN_SWAPS = 'fusion-disable-cross-chain-swaps',
  FUSION_QUICK_SWAPS = 'fusion-quick-swaps',
  SWAP_RECURRING = 'swap-recurring',
  ALTERNATE_APP_ICONS = 'alternate-app-icons',
  INJECTED_PROVIDER = 'injected-provider',
  PREDICTIONS = 'predictions',
  PRICE_CHART = 'price-chart',
  PERPETUALS = 'perpetuals',
  FAST_STAKE_ENABLED = 'fast-stake-enabled',
  // The two fee gates below are multivariate: enabling a fee requires a
  // variant string carrying the rate in basis points (e.g. '1000' = 10%).
  // Anything without a positive parsable rate — a plain boolean `true`, a
  // '0' variant, or an unparsable variant — behaves exactly like the flag
  // being off (see `selectIs*FeeBlocked` in `store/posthog`).
  FAST_STAKE_FEE_ENABLED = 'fast-stake-fee-enabled',
  DELEGATION_FEE_ENABLED = 'delegation-fee-enabled'
}

export enum FeatureVars {
  SENTRY_SAMPLE_RATE = 'sentry-sample-rate',
  P_FEE_ADJUSTMENT_THRESHOLD = 'p-fee-adjustment-threshold',
  C_BASE_FEE_MULTIPLIER = 'c-base-fee-multiplier',
  CROSS_CHAIN_FEES_MULTIPLIER = 'cross-chain-fees-multiplier',
  MARKR_SWAP_MAX_RETRIES = 'markr-swap-max-retries',
  STAKE_APY_BPS = 'stake-apy-bps',
  FUSION_FEE_UNITS_MARGIN_BPS = 'fusion-fee-units-margin-bps',
  FUSION_MAX_AMOUNT_GAS_SAFETY_BPS = 'fusion-max-amount-gas-safety-bps',
  FUSION_TRANSFER_GAS_MARGIN_BPS = 'fusion-transfer-gas-margin-bps',
  FUSION_MAX_AMOUNT_ADDITIVE_BPS_DEFAULT = 'fusion-max-amount-additive-bps-default',
  FUSION_MAX_AMOUNT_ADDITIVE_BPS_EVM_TO_SOLANA = 'fusion-max-amount-additive-bps-evm-to-solana',
  FUSION_MAX_AMOUNT_ADDITIVE_BPS_SOLANA_TO_EVM = 'fusion-max-amount-additive-bps-solana-to-evm',
  // 3-state override for the optimistic-confirmation gate ('auto' | 'enabled' |
  // 'disabled'). Mirrors core-extension's `sae-override` flag. Used to force the
  // post-Helicon (no optimistic confetti) flow on or off without a code release.
  SAE_OVERRIDE = 'sae-override'
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
