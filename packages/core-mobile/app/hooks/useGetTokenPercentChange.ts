import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectWatchlistTokens } from 'store/watchlist'

export const useGetTokenPercentChange = (): {
  getTokenPercentChange: (symbol: string) => number
} => {
  const watchlistTokens = useSelector(selectWatchlistTokens)

  const getTokenPercentChange = useCallback(
    (symbol: string): number => {
      const tokenInWatchlist = watchlistTokens.find(
        watchlistToken => watchlistToken.symbol === symbol.toLowerCase()
      )

      return tokenInWatchlist?.priceChangePercentage24h ?? 0
    },
    [watchlistTokens]
  )

  return { getTokenPercentChange }
}
