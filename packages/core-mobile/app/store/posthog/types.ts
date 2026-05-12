import { DEFAULT_ANNUAL_PERCENTAGE_YIELD_BPS } from 'features/stake/consts'
import { FeatureFlags, FeatureGates, FeatureVars } from 'services/posthog/types'
import { uuid } from 'utils/uuid'

export const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.EARN]: true,
  [FeatureVars.SENTRY_SAMPLE_RATE]: '10', // 10% of events/errors
  [FeatureVars.P_FEE_ADJUSTMENT_THRESHOLD]: '1e-3', // 0.1%
  [FeatureVars.CROSS_CHAIN_FEES_MULTIPLIER]: '4e0', // 400%
  [FeatureVars.C_BASE_FEE_MULTIPLIER]: '1e0', // 100%
  [FeatureVars.MARKR_SWAP_MAX_RETRIES]: '3', // 3 retries
  [FeatureVars.STAKE_APY_BPS]: `${DEFAULT_ANNUAL_PERCENTAGE_YIELD_BPS}`,
  [FeatureVars.FUSION_FEE_UNITS_MARGIN_BPS]: '2000', // 20% fee units buffer
  [FeatureVars.FUSION_MAX_AMOUNT_GAS_SAFETY_BPS]: '6000', // 60% safety margin on gas (Max swap amount)
  [FeatureVars.FUSION_TRANSFER_GAS_MARGIN_BPS]: '2000', // 20% gas units buffer for transfers
  [FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_DEFAULT]: '4000', // 40% additive fee buffer for Max swap amount (default routes)
  [FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_EVM_TO_SOLANA]: '5500', // 55% additive fee buffer for Max swap amount (evm→solana)
  [FeatureVars.FUSION_MAX_AMOUNT_ADDITIVE_BPS_SOLANA_TO_EVM]: '4000', // 40% additive fee buffer for Max swap amount (solana→evm)
  [FeatureGates.BUY_COINBASE_PAY]: true,
  [FeatureGates.SEEDLESS_ONBOARDING]: true,
  [FeatureGates.SEEDLESS_ONBOARDING_GOOGLE]: true,
  [FeatureGates.SEEDLESS_ONBOARDING_APPLE]: true,
  [FeatureGates.SEEDLESS_MFA_PASSKEY]: true,
  [FeatureGates.SEEDLESS_MFA_AUTHENTICATOR]: true,
  [FeatureGates.SEEDLESS_MFA_YUBIKEY]: true,
  [FeatureGates.SEEDLESS_SIGNING]: true,
  [FeatureGates.BLOCKAID_DAPP_SCAN]: true,
  [FeatureGates.ALL_NOTIFICATIONS]: true,
  [FeatureGates.HALLIDAY_BRIDGE_BANNER]: true,
  [FeatureGates.GASLESS]: true,
  [FeatureGates.MELD_ONRAMP]: true,
  [FeatureGates.MELD_OFFRAMP]: true,
  [FeatureGates.SOLANA_SUPPORT]: true,
  [FeatureGates.SWAP_SOLANA]: true,
  [FeatureGates.IN_APP_UPDATE_ANDROID]: true,
  [FeatureGates.ENABLE_MELD_SANDBOX]: false,
  [FeatureGates.SOLANA_LAUNCH_MODAL]: false,
  [FeatureGates.LEDGER_SUPPORT]: true,
  [FeatureGates.IN_APP_DEFI]: false,
  [FeatureGates.IN_APP_DEFI_IS_NEW]: true,
  [FeatureGates.IN_APP_DEFI_BORROW]: false,
  [FeatureGates.IN_APP_REVIEW]: true,
  [FeatureGates.GASLESS_INSTANT]: true,
  [FeatureGates.NEST_EGG_CAMPAIGN]: false,
  [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: false,
  [FeatureGates.FUSION]: false,
  [FeatureGates.FUSION_MARKR]: false,
  [FeatureGates.FUSION_AVALANCHE_EVM]: false,
  [FeatureGates.FUSION_LOMBARD_BTC_TO_BTCB]: false,
  [FeatureGates.FUSION_LOMBARD_BTCB_TO_BTC]: false,
  [FeatureGates.FUSION_DISABLE_CROSS_CHAIN_SWAPS]: false,
  [FeatureGates.FUSION_QUICK_SWAPS]: false,
  [FeatureGates.ALTERNATE_APP_ICONS]: false,
  [FeatureGates.INJECTED_PROVIDER]: false,
  [FeatureGates.PREDICTIONS]: false
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
