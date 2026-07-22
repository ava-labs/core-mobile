import { TokenUnit } from '@avalabs/core-utils-sdk'
import { USDC_DECIMALS } from '../consts'

/**
 * Collapses an amount coming out of `TokenUnitInputWidget` to a plain number
 * at exact USDC precision, always rounding down.
 *
 * Not `toDisplay({ asNumber: true })`: that rounds half-up at 4 decimals, so a
 * Max amount like 44.148877 becomes 44.1489 and gets rejected as exceeding the
 * balance it was derived from. Percentage presets can also carry fractional
 * subunits (25% of a 6-decimal balance) which `parseUnits(…, 6)` downstream
 * rejects — `toSubUnit()` floors those away.
 */
export const usdcAmountFromTokenUnit = (value: TokenUnit): number =>
  Number(new TokenUnit(value.toSubUnit(), USDC_DECIMALS, 'USDC').toString())

/**
 * Converts a USD float (e.g. the Hyperliquid withdrawable) to a USDC
 * `TokenUnit`, rounding down so the resulting balance never overstates what is
 * actually available.
 */
export const floorToUsdcUnit = (amount: number): TokenUnit =>
  new TokenUnit(Math.floor(amount * 10 ** USDC_DECIMALS), USDC_DECIMALS, 'USDC')
