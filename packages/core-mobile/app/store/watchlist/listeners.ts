import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { onLogIn } from 'store/app'
import { AnyAction } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  ViewOnceKey,
  selectHasBeenViewedOnce,
  setViewOnce
} from 'store/viewOnce'
import Logger from 'utils/Logger'
import { addDefaultWatchlistFavorites } from './slice'

const addDefaultFavorites = (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  //check if we've added P chain before
  const hadAddedDefaultFavorites = selectHasBeenViewedOnce(
    ViewOnceKey.DEFAULT_WATCHLIST_FAVORITES
  )(state)
  if (hadAddedDefaultFavorites) {
    Logger.trace('Already added default watchlist favorites')
    return
  }
  dispatch(addDefaultWatchlistFavorites())
  AnalyticsService.capture('DefaultWatchlistFavoritesAdded')
  dispatch(setViewOnce(ViewOnceKey.DEFAULT_WATCHLIST_FAVORITES))
}

export const addWatchlistListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onLogIn,
    effect: addDefaultFavorites
  })
}
