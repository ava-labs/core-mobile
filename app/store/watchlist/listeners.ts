import { AppStartListening } from 'store/middleware/listener'
import { onRehydrationComplete } from 'store/app'
import { AppListenerEffectAPI } from 'store/index'
import watchlistService from 'services/watchlist/WatchlistService'
import { selectActiveNetwork, selectNetworks, setActive } from 'store/network'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  appendWatchlist,
  onWatchlistRefresh,
  selectWatchlistFavorites,
  setWatchlistTokens
} from 'store/watchlist/slice'
import { Action, isAnyOf } from '@reduxjs/toolkit'

type EmptyAction = {
  empty: string
}

async function fetchWatchlist(
  action: Action<EmptyAction>,
  listenerApi: AppListenerEffectAPI
) {
  const dispatch = listenerApi.dispatch
  const state = listenerApi.getState()
  const allNetworks = Object.values(selectNetworks(state) ?? [])
  const network = selectActiveNetwork(state)
  const currency = selectSelectedCurrency(state)

  const favoriteTokens = selectWatchlistFavorites(state)
  const watchlistTokens = await watchlistService.getMarketData(
    network,
    currency.toLowerCase(),
    allNetworks
  )

  dispatch(setWatchlistTokens(watchlistTokens))
  dispatch(appendWatchlist(favoriteTokens))
}

export const addWatchlistListeners = (startListening: AppStartListening) => {
  startListening({
    matcher: isAnyOf(onRehydrationComplete, setActive, onWatchlistRefresh),
    effect: fetchWatchlist
  })
}
