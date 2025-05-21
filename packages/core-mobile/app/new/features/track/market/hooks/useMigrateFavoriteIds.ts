import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import {
  selectWatchlistFavoriteIds,
  toggleWatchListFavorite
} from 'store/watchlist'

/**
 * @description
 * This hook is used to migrate favorite IDs from coingecko/contract address
 * to internalId
 */
export const useMigrateFavoriteIds = (): {
  hasMigratedFavoriteIds: boolean
} => {
  const {
    topTokens,
    trendingTokens,
    isLoadingTrendingTokens,
    isLoadingTopTokens
  } = useWatchlist()
  const dispatch = useDispatch()
  const favoriteIds = useSelector(selectWatchlistFavoriteIds)
  const hasMigratedFavoriteIds = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.MIGRATE_TOKEN_FAVORITE_IDS)
  )

  useEffect(() => {
    if (
      hasMigratedFavoriteIds ||
      isLoadingTrendingTokens ||
      isLoadingTopTokens ||
      favoriteIds.length === 0
    )
      return

    favoriteIds.forEach((favoriteId: string) => {
      const topToken = topTokens.find(
        token => token.coingeckoId?.toLowerCase() === favoriteId.toLowerCase()
      )
      if (topToken) {
        // if the token is in the top tokens, we need to remove it from the favorites
        // and add it again with the new id
        dispatch(toggleWatchListFavorite(favoriteId))
        dispatch(toggleWatchListFavorite(topToken.id.toLowerCase()))
        return
      }
      const trendingToken = trendingTokens.find(token =>
        token.id.toLowerCase().includes(favoriteId.toLowerCase())
      )
      if (trendingToken) {
        // if the token is in the trending tokens, we need to remove it from the favorites
        // and add it again with the new id
        dispatch(toggleWatchListFavorite(favoriteId))
        dispatch(toggleWatchListFavorite(trendingToken.id.toLowerCase()))
      }
    })

    // after the migration is done, we need to set the view once
    // so we don't run the migration again
    dispatch(setViewOnce(ViewOnceKey.MIGRATE_TOKEN_FAVORITE_IDS))
  }, [
    hasMigratedFavoriteIds,
    favoriteIds.length,
    isLoadingTrendingTokens,
    isLoadingTopTokens,
    dispatch,
    favoriteIds,
    topTokens,
    trendingTokens
  ])

  return {
    hasMigratedFavoriteIds
  }
}
