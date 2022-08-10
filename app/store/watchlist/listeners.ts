import { AppStartListening } from 'store/middleware/listener'
import { onRehydrationComplete } from 'store/app'
import { AppListenerEffectAPI } from 'store/index'
import watchlistService from 'services/watchlist/WatchlistService'
import { selectActiveNetwork, selectNetworks, setActive } from 'store/network'
import { selectSelectedCurrency } from 'store/settings/currency'
import { onWatchlistRefresh, setWatchlistTokens } from 'store/watchlist/slice'
import { isAnyOf } from '@reduxjs/toolkit'

async function fetchWatchlist(action: any, listenerApi: AppListenerEffectAPI) {
  const dispatch = listenerApi.dispatch
  const state = listenerApi.getState()
  const allNetworks = Object.values(selectNetworks(state) ?? [])
  const network = selectActiveNetwork(state)
  const currency = selectSelectedCurrency(state)

  const watchlistTokens = await watchlistService.getMarketData(
    network,
    currency.toLowerCase(),
    allNetworks
  )

  dispatch(setWatchlistTokens(watchlistTokens))
}

export const addWatchlistListeners = (startListening: AppStartListening) => {
  startListening({
    matcher: isAnyOf(onRehydrationComplete, setActive, onWatchlistRefresh),
    effect: fetchWatchlist
  })
}
