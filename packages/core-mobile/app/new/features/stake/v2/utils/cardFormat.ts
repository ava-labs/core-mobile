import { format, fromUnixTime } from 'date-fns'

/**
 * Append the currency code to a formatted token amount unless it's already
 * present.
 *
 * `formatTokenInCurrency` only emits a trailing currency code for currencies
 * whose symbol equals the ISO code (e.g. CHF, NOK). For currencies like USD
 * the result is just "$327.64" with no suffix. The V2 stake card design wants
 * an explicit suffix in every case ("$327.64 USD"), so append the code unless
 * it's already there to avoid duplicates like "327.64 CHF CHF".
 */
export const ensureCurrencySuffix = (
  formatted: string,
  currency: string
): string =>
  formatted.endsWith(currency) ? formatted : `${formatted} ${currency}`

/**
 * Format a stake's `endTimestamp` (Unix seconds) as `MM/dd/yyyy`, or return an
 * em-dash placeholder when the timestamp is missing.
 */
export const formatEndDate = (endTimestamp?: number): string => {
  if (!endTimestamp) return '—'
  return format(fromUnixTime(endTimestamp), 'MM/dd/yyyy')
}
