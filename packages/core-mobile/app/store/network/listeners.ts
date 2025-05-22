import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { onAppUnlocked } from 'store/app'
import {
  noActiveNetwork,
  selectCustomNetworks,
  setActive,
  selectEnabledChainIds,
  toggleEnabledChainId,
  enableL2ChainIds
} from 'store/network/slice'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'

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

const toggleEnabledChainIdSideEffect = (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const chainId = action.payload
  const { getState } = listenerApi
  const state = getState()
  const customNetworks = selectCustomNetworks(state)
  const enabledChainIds = selectEnabledChainIds(state)
  const isCustomNetwork = Object.values(customNetworks)
    .map((n: Network) => n.chainId)
    .includes(chainId)

  const event = enabledChainIds.includes(chainId)
    ? 'NetworkEnabled'
    : 'NetworkDisabled'

  AnalyticsService.capture(event, {
    networkChainId: chainId,
    isCustom: isCustomNetwork
  })
}

const enableL2ChainIdsIfNeeded = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const hasToggledL2ChainIds = selectHasBeenViewedOnce(
    ViewOnceKey.AUTO_ENABLE_L2_CHAINS
  )(state)

  if (hasToggledL2ChainIds === false) {
    dispatch(enableL2ChainIds())
    dispatch(setViewOnce(ViewOnceKey.AUTO_ENABLE_L2_CHAINS))
  }
}

export const addNetworkListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode),
    effect: setActiveNetwork
  })

  startListening({
    matcher: isAnyOf(onAppUnlocked),
    effect: enableL2ChainIdsIfNeeded
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: adjustActiveNetwork
  })

  startListening({
    matcher: isAnyOf(toggleEnabledChainId),
    effect: toggleEnabledChainIdSideEffect
  })
}
