import React from 'react'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import WatchList from './components/WatchList'
import { WatchListType } from './types'

export const TrendingTokens = (): React.JSX.Element => {
  const {
    trendingTokens: tokens,
    prices,
    charts,
    isLoadingTrendingTokens
  } = useWatchlist()
  const isFetchingTokens = tokens.length === 0 && isLoadingTrendingTokens

  return (
    <>
      {isFetchingTokens ? (
        <WatchListLoader />
      ) : (
        <>
          <WatchList
            type={WatchListType.TRENDING}
            tokens={tokens}
            charts={charts}
            prices={prices}
            testID="watchlist_item"
          />
        </>
      )}
    </>
  )
}
