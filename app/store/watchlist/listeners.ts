import { AppStartListening } from 'store/middleware/listener'
import { onRehydrationComplete } from 'store/app'
import { AppListenerEffectAPI } from 'store/index'
import watchlistService from 'services/watchlist/WatchlistService'
import { selectActiveNetwork, setActive } from 'store/network'
import { selectSelectedCurrency } from 'store/settings/currency'
import {onWatchlistRefresh, setWatchlistTokens} from 'store/watchlist/slice';
import { isAnyOf } from '@reduxjs/toolkit'

export const addWatchlistListeners = (startListening: AppStartListening) => {
  async function fetchBalancePeriodically(
    action: any,
    listenerApi: AppListenerEffectAPI
  ) {
    // const { condition } = listenerApi
    const dispatch = listenerApi.dispatch
    const state = listenerApi.getState()
    const network = selectActiveNetwork(state)
    const currency = selectSelectedCurrency(state)
    const watchlistTokens = await watchlistService.getBalances(
      network,
      currency
    )
    dispatch(setWatchlistTokens(watchlistTokens))
  }

  startListening({
    matcher: isAnyOf(onRehydrationComplete, setActive, onWatchlistRefresh),
    effect: fetchBalancePeriodically
  })
}
