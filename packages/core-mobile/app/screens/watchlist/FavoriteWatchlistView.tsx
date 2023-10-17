import React, { Dispatch } from 'react'
import {
  selectWatchlistCharts,
  selectWatchlistFavorites,
  selectWatchlistPrices,
  selectWatchlistTokens
} from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import { WatchlistFilter } from 'screens/watchlist/types'
import WatchList from './components/WatchList'

interface Props {
  onTabIndexChanged?: Dispatch<number>
  testID?: string
}

const FavoriteWatchlistView: React.FC<Props> = ({ onTabIndexChanged }) => {
  const favorites = useFocusedSelector(selectWatchlistFavorites)
  const tokens = useFocusedSelector(selectWatchlistTokens)
  const prices = useFocusedSelector(selectWatchlistPrices)
  const charts = useFocusedSelector(selectWatchlistCharts)

  const isFetchingTokens = tokens.length === 0

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
