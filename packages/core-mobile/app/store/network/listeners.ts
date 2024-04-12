import { ChainId } from '@avalabs/chains-sdk'
import { AppListenerEffectAPI } from 'store'
import { onAppUnlocked } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { noActiveNetwork, setActive, toggleFavorite } from 'store/network'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'

const adjustActiveNetwork = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const isDeveloperMode = selectIsDeveloperMode(state)

  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID

  dispatch(setActive(chainId))
}

const setActiveNetwork = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  if (state.network.active === noActiveNetwork) {
    dispatch(setActive(ChainId.AVALANCHE_MAINNET_ID))
  }
}

const toggleFavoriteSideEffect = (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const chainId = action.payload
  const { getState } = listenerApi
  const network = getState().network
  const isCustomNetwork = Object.values(network.customNetworks)
    .map(n => n.chainId)
    .includes(chainId)

  const event = network.favorites.includes(chainId)
    ? 'NetworkFavoriteAdded'
    : 'NetworkFavoriteRemoved'

  AnalyticsService.capture(event, {
    networkChainId: chainId,
    isCustom: isCustomNetwork
  })
}

export const addNetworkListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode),
    effect: setActiveNetwork
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: adjustActiveNetwork
  })

  startListening({
    actionCreator: toggleFavorite,
    effect: toggleFavoriteSideEffect
  })
}
