import Config from 'react-native-config'
import { ChainId } from '@avalabs/core-chains-sdk'
import { FeatureFlags, FeatureGates } from 'services/posthog/types'

export const isLimitedMode: boolean = Config.LIMITED_MODE === 'true'

export const LIMITED_MODE_FORCED_TRUE: FeatureGates[] = [
  FeatureGates.EVERYTHING,
  FeatureGates.SEEDLESS_ONBOARDING,
  FeatureGates.SEEDLESS_ONBOARDING_GOOGLE,
  FeatureGates.SEEDLESS_SIGNING,
  FeatureGates.SEEDLESS_MFA_PASSKEY,
  FeatureGates.SEEDLESS_MFA_AUTHENTICATOR,
  FeatureGates.SEEDLESS_MFA_YUBIKEY,
  FeatureGates.FUSION,
  FeatureGates.FUSION_MARKR,
  FeatureGates.FUSION_AVALANCHE_EVM,
  FeatureGates.FUSION_LOMBARD_BTC_TO_BTCB,
  FeatureGates.FUSION_LOMBARD_BTCB_TO_BTC,
  FeatureGates.MELD_ONRAMP,
  FeatureGates.MELD_OFFRAMP
]

export const LIMITED_MODE_FORCED_FALSE: FeatureGates[] = [
  FeatureGates.IMPORT_EXISTING_WALLET,
  FeatureGates.HARDWARE_WALLET_ONBOARDING,
  FeatureGates.ADD_WALLET,
  FeatureGates.WALLET_CONNECT,
  FeatureGates.SETTINGS_ADVANCED,
  FeatureGates.BRIDGE_BTC,
  FeatureGates.BRIDGE_ETH,
  FeatureGates.LEGACY_BRIDGE,
  FeatureGates.UNIFIED_BRIDGE_CCTP,
  FeatureGates.UNIFIED_BRIDGE_ICTT,
  FeatureGates.UNIFIED_BRIDGE_AB_EVM,
  FeatureGates.UNIFIED_BRIDGE_AB_AVA_TO_BTC,
  FeatureGates.UNIFIED_BRIDGE_AB_BTC_TO_AVA,
  FeatureGates.BUY_COINBASE_PAY,
  FeatureGates.EARN,
  FeatureGates.IN_APP_DEFI,
  FeatureGates.IN_APP_DEFI_BORROW,
  FeatureGates.PREDICTIONS,
  FeatureGates.LEDGER_SUPPORT,
  FeatureGates.KEYSTONE,
  FeatureGates.INJECTED_PROVIDER,
  FeatureGates.BLOCKAID_DAPP_SCAN,
  FeatureGates.NEST_EGG_CAMPAIGN,
  FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY,
  FeatureGates.HALLIDAY_BRIDGE_BANNER,
  FeatureGates.SOLANA_SUPPORT,
  FeatureGates.SOLANA_LAUNCH_MODAL,
  FeatureGates.SWAP_SOLANA,
  FeatureGates.FUSION_DISABLE_CROSS_CHAIN_SWAPS,
  FeatureGates.ALL_NOTIFICATIONS,
  FeatureGates.ENABLE_NOTIFICATION_PROMPT
]

export const applyLimitedModeOverrides = (
  flags: FeatureFlags
): FeatureFlags => {
  if (!isLimitedMode) return flags
  const overridden: FeatureFlags = { ...flags }
  for (const gate of LIMITED_MODE_FORCED_TRUE) {
    overridden[gate] = true
  }
  for (const gate of LIMITED_MODE_FORCED_FALSE) {
    overridden[gate] = false
  }
  return overridden
}

// Allowed chain IDs in limited mode (the chains where allowlisted tokens
// live). Used to filter network pickers and activity feed scope.
export const LIMITED_MODE_ALLOWED_CHAIN_IDS: ReadonlySet<number> = new Set([
  ChainId.ETHEREUM_HOMESTEAD, // 1
  ChainId.AVALANCHE_MAINNET_ID, // 43114
  ChainId.BITCOIN,
  // testnet equivalents (limited mode is mainnet-only by design but harmless
  // to allow if developer mode is somehow toggled on)
  ChainId.ETHEREUM_TEST_SEPOLIA,
  ChainId.AVALANCHE_TESTNET_ID,
  ChainId.BITCOIN_TESTNET
])

// Allowlist of tokens that may be swapped or bought in limited mode.
// Identifier scheme matches Fusion's `internalId` field.
export const LIMITED_MODE_SWAP_ALLOWED_INTERNAL_IDS: ReadonlySet<string> =
  new Set([
    'NATIVE-avax',
    'NATIVE-eth',
    'NATIVE-btc',
    // USDT (Avalanche, native USDT contract)
    'eip155:43114-0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
    // USDT (Ethereum, Tether USD)
    'eip155:1-0xdac17f958d2ee523a2206206994597c13d831ec7',
    // BTC.b (Avalanche)
    'eip155:43114-0x152b9d0fdc40c096757f570a51e494bd4b943e50'
  ])

export const isAllowedLimitedSwapToken = (
  token: { internalId?: string | null } | null | undefined
): boolean => {
  if (!isLimitedMode) return true
  if (!token?.internalId) return false
  return LIMITED_MODE_SWAP_ALLOWED_INTERNAL_IDS.has(token.internalId)
}

// Meld returns CryptoCurrency objects with currencyCode + numeric chainId +
// contractAddress. BTC is special-cased by currencyCode (no chainId/contract).
export const isAllowedLimitedBuyCrypto = (
  crypto:
    | {
        currencyCode?: string | null
        chainId?: number | string | null
        contractAddress?: string | null
      }
    | null
    | undefined
): boolean => {
  if (!isLimitedMode) return true
  if (!crypto) return false
  if (crypto.currencyCode === 'BTC') return true
  const chain = String(crypto.chainId ?? '')
  const addr = (crypto.contractAddress ?? '').toLowerCase()
  const isNativeContract =
    !addr || addr === '0x0000000000000000000000000000000000000000'
  if (isNativeContract && (chain === '43114' || chain === '1')) return true
  return (
    (chain === '43114' &&
      addr === '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7') ||
    (chain === '1' &&
      addr === '0xdac17f958d2ee523a2206206994597c13d831ec7') ||
    (chain === '43114' && addr === '0x152b9d0fdc40c096757f570a51e494bd4b943e50')
  )
}
