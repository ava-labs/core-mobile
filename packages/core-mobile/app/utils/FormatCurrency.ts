/**
 * formatCurrency formats the currency to return:
 *   <symbol><amount>
 *   e.g. $10.00, €10.00
 * If <symbol> matches the currency code (e.g. "CHF 10") then it returns:
 *   <amount> <symbol>
 *   e.g. 10 CHF
 */
import { NotationTypes } from 'consts/FormatNumberTypes'
import memoize from 'lodash/memoize'

interface FormatCurrencyProps {
  amount: number
  currency: string
  boostSmallNumberPrecision: boolean
  notation?: NotationTypes
}

export function formatCurrency({
  amount,
  currency,
  boostSmallNumberPrecision,
  notation
}: FormatCurrencyProps): string {
  const formatter = selectCurrencyFormat({
    amount,
    currency,
    boostSmallNumberPrecision,
    notation
  })
  const formatted = formatter.format(amount)

  // Check if the currency appears at the beginning
  if (formatted.startsWith(currency)) {
    // Move the currency to the end
    return `${formatted.slice(currency.length).trim()} ${currency}`
  }

  // Check if the currency appears after a sign (e.g., "-CHF 10")
  const signMatch = formatted.match(/^([-+])\s*([A-Z]{3})\s*(.*)/)
  if (signMatch && signMatch[2] === currency) {
    const sign = signMatch[1]
    const number = signMatch[3] ?? ''
    return `${sign}${number.trim()} ${currency}`
  }

  // Default case: return the formatted string as is
  return formatted
}

const getCurrencyNumberFormat = memoize(
  (currency: string) =>
    new Intl.NumberFormat('en-US', {
      ...commonNumberFormat(currency),
      maximumFractionDigits: 2
    })
)

const getSmallNumberCurrencyNumberFormat = memoize(
  (currency: string) =>
    new Intl.NumberFormat('en-US', {
      ...commonNumberFormat(currency),
      maximumFractionDigits: 8
    })
)

const getCompactCurrencyNumberFormat = memoize(
  (currency: string) =>
    new Intl.NumberFormat('en-US', {
      ...commonNumberFormat(currency),
      maximumFractionDigits: 2,
      notation: 'compact'
    })
)

const commonNumberFormat = (
  currency: string
): Partial<Intl.NumberFormatOptions> => {
  return {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol', // the extension uses 'narrowSymbol'
    minimumFractionDigits: 2
  }
}

const selectCurrencyFormat = ({
  amount,
  currency,
  boostSmallNumberPrecision,
  notation
}: FormatCurrencyProps): Intl.NumberFormat => {
  if (notation === 'compact') {
    return getCompactCurrencyNumberFormat(currency)
  }
  return boostSmallNumberPrecision && amount < 1
    ? getSmallNumberCurrencyNumberFormat(currency)
    : getCurrencyNumberFormat(currency)
}
