import { useMemo } from 'react'
import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Account } from 'store/account'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { useTokensWithBalanceForAccount } from './useTokensWithBalanceForAccount'
import { useBalanceTotalInCurrencyForAccount } from './useBalanceTotalInCurrencyForAccount'

/**
 * Computes the 24-hour performance summary for the specified account,
 * including total fiat value change, percentage change, and trend direction.
 *
 * This hook aggregates all token balances for the account and uses
 * market data (via the watchlist) to calculate how much the account’s total
 * fiat value has increased or decreased in the past 24 hours.
 *
 * Returns:
 *  - `valueChange24h` (number | undefined): total fiat value change over the past 24 hours
 *  - `percentChange24h` (number | undefined): percentage change over the past 24 hours
 *  - `trend24h` (PriceChangeStatus): enum indicating direction (Up, Down, Neutral)
 */
export const useAccountPerformanceSummary = (
  account?: Account
): {
  percentChange24h: string | undefined
  valueChange24h: string | undefined
  indicatorStatus: PriceChangeStatus
} => {
  const { formatCurrency } = useFormatCurrency()
  const totalPriceChange = useBalanceTotalPriceChangeForAccount(account)
  const balanceTotalInCurrency = useBalanceTotalInCurrencyForAccount(account)

  const valueChange24h =
    totalPriceChange !== 0
      ? formatCurrency({ amount: Math.abs(totalPriceChange) })
      : undefined

  const indicatorStatus =
    totalPriceChange > 0
      ? PriceChangeStatus.Up
      : totalPriceChange < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  const totalPriceChangeInPercent = useMemo(() => {
    return (totalPriceChange / balanceTotalInCurrency) * 100
  }, [balanceTotalInCurrency, totalPriceChange])

  const percentChange24h = useMemo(
    () =>
      !isFinite(totalPriceChangeInPercent) || totalPriceChangeInPercent === 0
        ? undefined
        : totalPriceChangeInPercent.toFixed(2) + '%',
    [totalPriceChangeInPercent]
  )

  return {
    indicatorStatus,
    percentChange24h,
    valueChange24h
  }
}

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
const useBalanceTotalPriceChangeForAccount = (account?: Account): number => {
  const { getMarketTokenBySymbol } = useWatchlist()
  const tokens = useTokensWithBalanceForAccount(account)

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
