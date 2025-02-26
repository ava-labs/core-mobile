import React, { Dispatch } from 'react'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import WatchList from './components/WatchList'
import { WatchListType } from './types'

export const FavoriteTokens = ({
  onTabIndexChanged
}: {
  onTabIndexChanged?: Dispatch<number>
}): React.JSX.Element => {
  const { favorites, prices, charts, allTokens } = useWatchlist()

  const isFetchingTokens = allTokens.length === 0

  return (
    <>
      {isFetchingTokens ? (
        <WatchListLoader />
      ) : (
        <>
          <WatchList
            type={WatchListType.FAVORITES}
            tokens={favorites}
            charts={charts}
            prices={prices}
            onExploreAllTokens={() => onTabIndexChanged?.(1)}
            testID="watchlist_item"
          />
        </>
      )}
    </>
  )
}
