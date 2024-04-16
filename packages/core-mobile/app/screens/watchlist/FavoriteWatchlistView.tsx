import React, { Dispatch } from 'react'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import { WatchlistFilter } from 'screens/watchlist/types'
import { useWatchlist } from 'hooks/useWatchlist'
import WatchList from './components/WatchList'

interface Props {
  onTabIndexChanged?: Dispatch<number>
  testID?: string
}

const FavoriteWatchlistView: React.FC<Props> = ({ onTabIndexChanged }) => {
  const { favorites, prices, charts } = useWatchlist()

  const isFetchingTokens = favorites.length === 0

  return (
    <>
      {isFetchingTokens ? (
        <WatchListLoader />
      ) : (
        <>
          <WatchList
            tokens={favorites}
            charts={charts}
            prices={prices}
            isShowingFavorites={true}
            onExploreAllTokens={() => onTabIndexChanged?.(1)}
            filterBy={WatchlistFilter.MARKET_CAP}
            testID="watchlist_item"
          />
        </>
      )}
    </>
  )
}

export default FavoriteWatchlistView
