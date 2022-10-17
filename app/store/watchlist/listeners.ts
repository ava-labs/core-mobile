import { AppStartListening } from 'store/middleware/listener'
import { onRehydrationComplete } from 'store/app'
import { AppListenerEffectAPI } from 'store/index'
import { selectNetworks } from 'store/network'
import {
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import {
  onWatchlistRefresh,
  selectWatchlistFavoriteIds,
  setCharts,
  setPrices,
  setTokens
} from 'store/watchlist/slice'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { toggleDeveloperMode } from 'store/settings/advanced'
import WatchlistService from 'services/watchlist/WatchlistService'

async function getTokens(action: Action, listenerApi: AppListenerEffectAPI) {
  const dispatch = listenerApi.dispatch
  const state = listenerApi.getState()
  const currency = selectSelectedCurrency(state)
  const allNetworks = Object.values(selectNetworks(state))
  const cachedFavoriteTokenIds = selectWatchlistFavoriteIds(state)
  const { tokens, charts } = await WatchlistService.getTokens(
    currency,
    allNetworks,
    cachedFavoriteTokenIds
  )
  dispatch(setTokens(tokens))
  dispatch(setCharts(charts))
}

async function getPrices(action: Action, listenerApi: AppListenerEffectAPI) {
  const dispatch = listenerApi.dispatch
  const state = listenerApi.getState()
  const currency = selectSelectedCurrency(state).toLowerCase()
  const tokenIds = Object.values(state.watchlist.tokens).map(token => token.id)

  const prices = await WatchlistService.getPrices(
    tokenIds,
    currency as VsCurrencyType
  )

  dispatch(setPrices(prices))
}

export const addWatchlistListeners = (startListening: AppStartListening) => {
  startListening({
    matcher: isAnyOf(
      onRehydrationComplete,
      toggleDeveloperMode,
      onWatchlistRefresh
    ),
    effect: getTokens
  })

  startListening({
    matcher: isAnyOf(setTokens, setSelectedCurrency),
    effect: getPrices
  })
}
