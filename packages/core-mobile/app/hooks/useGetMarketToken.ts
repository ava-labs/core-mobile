import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { MarketToken, selectWatchlistTokens } from 'store/watchlist'

export const useGetMarketToken = (): {
  getMarketToken: (symbol: string) => MarketToken | undefined
} => {
  const watchlistTokens = useSelector(selectWatchlistTokens)

  const getMarketToken = useCallback(
    (symbol: string): MarketToken | undefined =>
      watchlistTokens.find(
        watchlistToken =>
          watchlistToken.symbol.toLowerCase() === symbol.toLowerCase()
      ),
    [watchlistTokens]
  )

  return { getMarketToken }
}
