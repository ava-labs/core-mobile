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
  // IMPORT_EXISTING_WALLET stays enabled in limited mode so users can recover
  // a wallet via mnemonic. The Access Wallet screen still hides Ledger /
  // Keystone (those gates remain forced off below).
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

// Tokens delivered by the Balance API (`LocalTokenWithBalance`) carry
// `networkChainId` + (optional) `address` + a token-type discriminator. The
// internalId field is sometimes absent / inconsistently formatted across
// chains, so we identify allowlisted tokens by chain + address instead.
const USDT_AVAX = '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'
const USDT_ETH = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const BTC_B_AVAX = '0x152b9d0fdc40c096757f570a51e494bd4b943e50'

export const isAllowedLimitedLocalToken = (
  token:
    | {
        networkChainId?: number | null
        address?: string | null
        type?: string | null
        symbol?: string | null
      }
    | null
    | undefined
): boolean => {
  if (!isLimitedMode) return true
  if (!token) return false
  const chainId = Number(token.networkChainId)
  const addr = (token.address ?? '').toLowerCase()
  const isNative =
    !addr || addr === '0x0000000000000000000000000000000000000000'

  if (chainId === ChainId.BITCOIN || chainId === ChainId.BITCOIN_TESTNET) {
    return true
  }
  if (
    isNative &&
    (chainId === ChainId.AVALANCHE_MAINNET_ID ||
      chainId === ChainId.ETHEREUM_HOMESTEAD ||
      chainId === ChainId.AVALANCHE_TESTNET_ID ||
      chainId === ChainId.ETHEREUM_TEST_SEPOLIA)
  ) {
    return true
  }
  if (chainId === ChainId.AVALANCHE_MAINNET_ID) {
    return addr === USDT_AVAX || addr === BTC_B_AVAX
  }
  if (chainId === ChainId.ETHEREUM_HOMESTEAD) {
    return addr === USDT_ETH
  }
  return false
}

// Meld returns CryptoCurrency objects keyed primarily by `currencyCode`
// (the asset+chain identifier — e.g. "AVAX", "USDT_AVAX", "ETH_BASE").
// chainId/contractAddress are inconsistently populated (null for many AVAX
// entries), so we match against an explicit currencyCode allowlist.
// BTC.b is intentionally not included because Meld does not list it.
const ALLOWED_MELD_CURRENCY_CODES: ReadonlySet<string> = new Set([
  'BTC',
  'ETH',
  'AVAX',
  'USDT', // USDT on Ethereum
  'USDT_AVAX' // USDT on Avalanche
])

export const isAllowedLimitedBuyCrypto = (
  crypto:
    | {
        currencyCode?: string | null
      }
    | null
    | undefined
): boolean => {
  if (!isLimitedMode) return true
  const code = crypto?.currencyCode
  if (!code) return false
  return ALLOWED_MELD_CURRENCY_CODES.has(code)
}
