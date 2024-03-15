import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectWatchlistCharts, selectWatchlistTokens } from 'store/watchlist'

export const useGetTokenPercentChange = (): {
  getTokenPercentChange: (symbol: string) => number
} => {
  const watchlistTokens = useSelector(selectWatchlistTokens)
  const charts = useSelector(selectWatchlistCharts)

  const getTokenPercentChange = useCallback(
    (symbol: string): number => {
      const tokenInWatchlist = watchlistTokens.find(
        watchlistToken => watchlistToken.symbol === symbol.toLowerCase()
      )

      const diffValue = tokenInWatchlist?.id
        ? charts[tokenInWatchlist.id]?.ranges.diffValue ?? 0
        : 0

      const percentChange = tokenInWatchlist?.id
        ? charts[tokenInWatchlist.id]?.ranges.percentChange ?? 0
        : 0

      return diffValue < 0 ? -percentChange : percentChange
    },
    [charts, watchlistTokens]
  )

  return { getTokenPercentChange }
}
