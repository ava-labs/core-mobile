import { useMemo } from 'react'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Account } from 'store/account'
import { useTokensWithBalanceForAccount } from './useTokensWithBalanceForAccount'

/**
 * Calculates the total 24-hour fiat value change for a given account by aggregating
 * the individual token price movements weighted by each token’s fiat balance.
 *
 * This hook combines token balance data (from `useTokensWithBalanceForAccount`)
 * with market price change data (from the watchlist) to determine how much the
 * account’s total portfolio value has increased or decreased in the past 24 hours.
 *
 * Returns:
 *  - (number): The net fiat value change over the past 24 hours (can be positive or negative).
 */
export const useBalanceTotalPriceChangeForAccount = (
  account?: Account
): number => {
  const { getMarketTokenBySymbol } = useWatchlist()
  const tokens = useTokensWithBalanceForAccount({ account })

  return useMemo(
    () =>
      tokens.reduce((acc, token) => {
        const marketToken = getMarketTokenBySymbol(token.symbol)
        const percentChange = marketToken?.priceChangePercentage24h ?? 0
        const priceChange = token.balanceInCurrency
          ? (token.balanceInCurrency * percentChange) / 100
          : 0
        return acc + priceChange
      }, 0),
    [getMarketTokenBySymbol, tokens]
  )
}
