import { useMemo } from 'react'
import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useSelector } from 'react-redux'
import { Account, selectActiveAccount } from 'store/account'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { useTokensWithBalanceForAccount } from './useTokensWithBalanceForAccount'
import { useBalanceTotalInCurrencyForAccount } from './useBalanceTotalInCurrencyForAccount'

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

export const useBalanceHeaderData = (): {
  formattedPercent: string | undefined
  formattedPriceChange: string | undefined
  indicatorStatus: PriceChangeStatus
} => {
  const { formatCurrency } = useFormatCurrency()
  const activeAccount = useSelector(selectActiveAccount)
  const totalPriceChange = useBalanceTotalPriceChangeForAccount(activeAccount)
  const balanceTotalInCurrency =
    useBalanceTotalInCurrencyForAccount(activeAccount)

  const formattedPriceChange =
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

  const formattedPercent = useMemo(
    () =>
      !isFinite(totalPriceChangeInPercent) || totalPriceChangeInPercent === 0
        ? undefined
        : totalPriceChangeInPercent.toFixed(2) + '%',
    [totalPriceChangeInPercent]
  )

  return {
    indicatorStatus,
    formattedPercent,
    formattedPriceChange
  }
}
