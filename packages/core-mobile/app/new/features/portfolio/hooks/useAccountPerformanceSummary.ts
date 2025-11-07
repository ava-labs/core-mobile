import { useMemo } from 'react'
import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { Account } from 'store/account'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { useBalanceTotalInCurrencyForAccount } from './useBalanceTotalInCurrencyForAccount'
import { useBalanceTotalPriceChangeForAccount } from './useBalanceTotalPriceChangeForAccount'

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
