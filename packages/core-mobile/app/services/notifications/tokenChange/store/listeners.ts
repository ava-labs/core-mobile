import { AppStartListening } from 'store/middleware/listener'
import Logger from 'utils/Logger'
import { tokenChangeNotificationService } from 'services/notifications/tokenChange/service'
import { AnyAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import {
  selectWatchlistFavoriteIds,
  toggleWatchListFavorite
} from 'store/watchlist'

const setTokenSubscriptionsForFavorites = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const favoriteTokensCoingeckoIds = selectWatchlistFavoriteIds(state)

  Logger.info(
    '[services/notifications/tokenChange/store/listeners.ts] Setting token subscriptions for favorites:',
    favoriteTokensCoingeckoIds
  )
  try {
    await tokenChangeNotificationService.setTokenSubscriptions({
      tokenIds: favoriteTokensCoingeckoIds
    })
  } catch (error) {
    Logger.error(
      `[services/notifications/tokenChange/store/listeners.ts][effect]${error}`
    )
  }
}

export const addNotificationsTokenChangeListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: toggleWatchListFavorite,
    effect: setTokenSubscriptionsForFavorites
  })
}
