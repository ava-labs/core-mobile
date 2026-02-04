import { UNKNOWN_AMOUNT } from 'consts/amount'

type FormatCurrencyFn = (props: {
  amount: number
  notation?: 'compact'
  withoutCurrencySuffix?: boolean
  showLessThanThreshold?: boolean
}) => string

export type FormatBalanceDisplayParams = {
  balance: number
  isDeveloperMode: boolean
  formatCurrency: FormatCurrencyFn
  /**
   * If true, indicates all balances failed to load (error state)
   */
  hasError?: boolean
  /**
   * If true, removes the currency suffix (e.g., "USD") from the result
   */
  withoutCurrencySuffix?: boolean
}

/**
 * Formats balance display according to the following rules:
 * Show $0 for empty accounts on mainnet
 * Show $- when loading the balances fails (hasError = true)
 * Show $- when in testnet mode (isDeveloperMode = true)
 */
export function formatBalanceDisplay({
  balance,
  isDeveloperMode,
  formatCurrency,
  hasError = false,
  withoutCurrencySuffix = false
}: FormatBalanceDisplayParams): string {
  // Show $- when in testnet mode
  // Show $- when loading the balances fails
  if (isDeveloperMode || hasError) {
    return formatCurrency({
      amount: 0,
      withoutCurrencySuffix
    }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
  }

  // Show $0 for empty accounts on mainnet
  if (balance === 0) {
    return formatCurrency({
      amount: 0,
      withoutCurrencySuffix
    }).replace('0.00', '0')
  }

  // Show actual balance for accounts with funds
  return formatCurrency({
    amount: balance,
    notation: balance < 100000 ? undefined : 'compact',
    withoutCurrencySuffix,
    showLessThanThreshold: true
  })
}
