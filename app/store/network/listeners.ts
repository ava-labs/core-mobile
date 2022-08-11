import { ChainId } from '@avalabs/chains-sdk'
import NetworkService from 'services/network/NetworkService'
import { AppListenerEffectAPI } from 'store'
import { onAppUnlocked, onRehydrationComplete } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { noActiveNetwork, setActive, setNetworks } from 'store/network'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { isAnyOf } from '@reduxjs/toolkit'

const adjustActiveNetwork = async (
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const isDeveloperMode = selectIsDeveloperMode(state)

  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID

  dispatch(setActive(chainId))
}

const getNetworks = async (action: any, listenerApi: AppListenerEffectAPI) => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const networks = await NetworkService.getNetworks()

  dispatch(setNetworks(networks))

  if (state.network.active === noActiveNetwork) {
    dispatch(setActive(ChainId.AVALANCHE_MAINNET_ID))
  }
}

export const addNetworkListeners = (startListening: AppStartListening) => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode, onRehydrationComplete),
    effect: getNetworks
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: adjustActiveNetwork
  })
}
