import { Environment } from '@avalabs/fusion-sdk'
import { tokenIds } from 'consts/tokenIds'

export enum PriceImpactSeverity {
  Low = 'low',
  High = 'high',
  Critical = 'critical'
}

export enum PriceImpactAvailability {
  Hidden = 'hidden',
  Calculating = 'calculating',
  Unavailable = 'unavailable',
  Ready = 'ready'
}

/**
 * The partner ID Markr uses for EVM swaps.
 */
export const MARKR_EVM_PARTNER_ID =
  '0x655812b0b38b7733f8b36ec2bf870fd23be54cde979bcb722861de8ab6861fc4'

/**
 * Basis-points divisor (100% = 10_000 bps).
 */
export const BASIS_POINTS_DIVISOR = 10_000

/**
 * Minimum allowed slippage percentage for swaps.
 * @example 0.1 -> 0.1%
 */
export const MIN_SLIPPAGE_PERCENT = 0.1

/**
 * Maximum allowed slippage percentage for swaps.
 * @example 50 -> 50%
 */
export const MAX_SLIPPAGE_PERCENT = 50

export const PRICE_IMPACT_ROW_TITLE = 'Price impact'

export const PRICE_IMPACT_TOOLTIP_BODY =
  'Price impact is the effect of your swap on the price of the token. It is influenced by your order size and available liquidity. Core has no control over price impact.'

export const PRICE_IMPACT_UNKNOWN_RISK_TITLE = 'Unknown risk'
export const PRICE_IMPACT_UNKNOWN_RISK_DESCRIPTION =
  "Price data unavailable for one or more tokens. Core can't estimate how much this swap may impact the price. Proceed with caution."

export const PRICE_IMPACT_SWAP_DISABLED_TITLE = 'Swap disabled'
export const PRICE_IMPACT_SWAP_DISABLED_DESCRIPTION =
  'The price impact is too high to complete this swap'

export const PRICE_IMPACT_HIGH_TITLE = 'High price impact'

/**
 * Determines the Fusion Service environment based on app settings
 */
export function getFusionEnvironment(isDeveloperMode: boolean): Environment {
  // If developer mode is enabled, use TEST environment
  if (isDeveloperMode) {
    return Environment.TEST
  }

  // Default to production environment
  return Environment.PROD
}

/**
 * Special ID used to identify the "Auto" quote option in the UI
 * This represents letting the SDK automatically select the best quote
 */
export const AUTO_QUOTE_ID = 'auto'

export const WAVAX_ADDRESS = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'

export const DEFAULT_TOKEN_DECIMALS = 18

// TODO: these should come from the token lookup  api based on the current network instead of hardcoded
// For now, we need these to determine the decimals for native tokens since they don't come with an address
export const NATIVE_DECIMALS: Record<string, number> = {
  [tokenIds.ETH]: 18,
  [tokenIds.AVAX]: 18,
  [tokenIds.SOL]: 9,
  [tokenIds.BTC]: 8
}
