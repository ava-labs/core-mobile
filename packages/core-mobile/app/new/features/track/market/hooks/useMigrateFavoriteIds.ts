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
import Logger from 'utils/Logger'

/**
 * @description
 * This hook migrates existing user favorites from coingeckoId format to internalId format.
 * This ensures users don't lose their favorite tokens during the transition.
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
    selectHasBeenViewedOnce(ViewOnceKey.MIGRATE_TOKEN_FAVORITE_IDSv2)
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
      // Check if this favorite is already in internalId format
      if (
        favoriteId.includes(':') ||
        favoriteId.includes('NATIVE') ||
        favoriteId === undefined ||
        favoriteId === null
      ) {
        // Already in internalId format, skip migration
        return
      }

      dispatch(toggleWatchListFavorite(favoriteId)) // Remove old in any case

      // Look for a token with matching coingeckoId in top tokens
      const topToken = topTokens.find(
        token => token.coingeckoId?.toLowerCase() === favoriteId.toLowerCase()
      )
      if (topToken) {
        dispatch(toggleWatchListFavorite(topToken.id))
        return
      }

      // Look for a token with matching coingeckoId in trending tokens
      const trendingToken = trendingTokens.find(
        token => token.coingeckoId?.toLowerCase() === favoriteId.toLowerCase()
      )
      if (trendingToken) {
        dispatch(toggleWatchListFavorite(trendingToken.id))
      }
    })
    Logger.info('Migrated favorites')
    // Mark migration as completed
    dispatch(setViewOnce(ViewOnceKey.MIGRATE_TOKEN_FAVORITE_IDSv2))
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
