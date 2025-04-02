import React from 'react'
import { Dimensions } from 'react-native'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import WatchList from './components/WatchList'
import { WatchListType } from './types'

const PADDING_BOTTOM = Dimensions.get('window').height * 0.12

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
        <WatchList
          type={WatchListType.TRENDING}
          tokens={tokens}
          charts={charts}
          prices={prices}
          testID="watchlist_item"
          contentContainerStyle={{
            paddingBottom: PADDING_BOTTOM
          }}
        />
      )}
    </>
  )
}
