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
 *
 * Goes through TokenUnit's decimal math rather than
 * `Math.floor(amount * 1e6)`: the float multiply misrepresents some values
 * (`8.2 * 1e6 === 8199999.999999999`) and would under-floor them by a subunit.
 */
export const floorToUsdcUnit = (amount: number): TokenUnit => {
  const unit = new TokenUnit(0n, USDC_DECIMALS, 'USDC').add(amount)
  return new TokenUnit(unit.toSubUnit(), USDC_DECIMALS, 'USDC')
}
