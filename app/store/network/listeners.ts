import { ChainId } from '@avalabs/chains-sdk'
import { AppListenerEffectAPI } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { setActive } from 'store/network'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'

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

export const addNetworkListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: toggleDeveloperMode,
    effect: adjustActiveNetwork
  })
}
