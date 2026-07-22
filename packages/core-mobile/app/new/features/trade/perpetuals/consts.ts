/**
 * Hyperliquid perpetuals are mainnet-only in Core — there is no testnet path.
 * Shared constants for the perpetuals feature.
 */
import {
  TokenType as SdkTokenType,
  type Asset,
  type Caip2ChainId,
  type Chain
} from '@avalabs/fusion-sdk'
import { ChainId } from '@avalabs/core-chains-sdk'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'

/** Fractional digits Hyperliquid quotes a perp with = MAX_PERP_DECIMALS - szDecimals. */
export const MAX_PERP_DECIMALS = 6

/** React Query staleness for the (fairly static) market universe + contexts. */
export const MARKETS_STALE_TIME = 30 * 1000

/** React Query refetch cadence for live-ish REST snapshots when WS is unavailable. */
export const MARKETS_REFETCH_INTERVAL = 15 * 1000

/**
 * React Query staleness for HIP-3 (builder-deployed) market discovery. Builder
 * dexs/listings change rarely and discovery fans out one request per dex, so we
 * cache harder than the native universe to stay well within Hyperliquid's
 * request-weight limits.
 */
export const HIP3_MARKETS_STALE_TIME = 60 * 1000

/**
 * React Query staleness for the account's clearinghouse / open-orders read
 * paths. These are also streamed live over WebSocket, so the REST value only
 * needs to seed the first paint and re-seed after balance-changing actions;
 * `10s` matches the existing perps snapshot cadence.
 */
export const PERPS_ACCOUNT_STALE_TIME = 10 * 1000

/** Minimum USDC required to open a Hyperliquid deposit. */
export const MIN_DEPOSIT_USDC = 5

/** USDC decimals on C-Chain (matches the Hyperliquid deposit token). */
export const USDC_DECIMALS = 6

/** Native USDC contract on Avalanche C-Chain (mainnet). */
export const USDC_CCHAIN_ADDRESS = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'

/**
 * Fixed-route Markr bridge endpoints shared by the deposit and withdraw flows
 * (Avalanche C-Chain USDC <-> Hyperliquid perp USDC). Kept here so both hooks
 * resolve the same chain ids, RPC, and Hyperliquid token/asset.
 */

/** Hyperliquid's Fusion chain id (Markr's Hyperliquid perp leg). */
export const HYPERLIQUID_CAIP2 = 'eip155:1337' as Caip2ChainId

/** Hyperliquid perp USDC sentinel token address. */
export const HYPERLIQUID_USDC_ADDRESS =
  '0x00000000000000000000000000000000' as `0x${string}`

/** USDC decimals on Hyperliquid perps (differs from C-Chain's `USDC_DECIMALS`). */
export const HYPERLIQUID_USDC_DECIMALS = 8

/** Avalanche C-Chain EVM CAIP-2 id for the Fusion route leg (`eip155:43114`). */
export const CCHAIN_CAIP2 = getEvmCaip2ChainId(
  ChainId.AVALANCHE_MAINNET_ID
) as Caip2ChainId

/** Avalanche C-Chain public RPC used by the Fusion C-Chain leg. */
export const CCHAIN_RPC_URL = 'https://api.avax.network/ext/bc/C/rpc'

/** Hyperliquid Fusion `Chain` (deposit target / withdraw source). */
export const HYPERLIQUID_CHAIN: Chain = {
  chainId: HYPERLIQUID_CAIP2,
  chainName: 'Hyperliquid',
  rpcUrl: '',
  networkToken: {
    type: SdkTokenType.NATIVE,
    name: 'USDC',
    symbol: 'USDC',
    decimals: HYPERLIQUID_USDC_DECIMALS
  }
}

/** Hyperliquid perp USDC Fusion `Asset` (deposit target / withdraw source). */
export const HYPERLIQUID_ASSET: Asset = {
  type: SdkTokenType.ERC20,
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: HYPERLIQUID_USDC_DECIMALS,
  address: HYPERLIQUID_USDC_ADDRESS
}
