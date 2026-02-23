import Config from 'react-native-config'
import { Environment } from '@avalabs/unified-asset-transfer'

/**
 * The partner ID Markr uses for EVM swaps.
 */
export const MARKR_EVM_PARTNER_ID =
  '0x655812b0b38b7733f8b36ec2bf870fd23be54cde979bcb722861de8ab6861fc4'

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

/**
 * Markr API endpoint for Fusion Service
 */
// TODO add to env variables once stable https://ava-labs.atlassian.net/browse/CP-13381
export const MARKR_API_URL =
  Config.MARKR_API_URL ?? 'https://proxy-api.avax.network/proxy/markr-staging'

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
