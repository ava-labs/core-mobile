import { useMemo } from 'react'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Account } from 'store/account'
import { useTokensWithBalanceForAccount } from './useTokensWithBalanceForAccount'

export const useBalanceTotalPriceChangeForAccount = (
  account?: Account
): number => {
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
