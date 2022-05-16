import { createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit'
import { setNetwork } from '@avalabs/wallet-react-components'
import NetworkService from 'services/network/NetworkService'
import { onStorageReady } from '../actions'
import { setActive, selectActiveNetwork } from '../network'
import type { RootState, AppDispatch } from '../index'

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

const listener = createListenerMiddleware()

const startListening = listener.startListening as AppStartListening

// APP LIFECYCLE LISTENERS
startListening({
  actionCreator: onStorageReady,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    NetworkService.onStorageReady(state)

    // wallet-react-components sets MAINNET as network on app start
    // we need to set it back to whatever network persisted in our app
    // TODO: remove this once network refactor is done
    const network = selectActiveNetwork(state)
    setNetwork(network)
  }
})

// NETWORK LISTENERS
startListening({
  actionCreator: setActive,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    const network = selectActiveNetwork(state)
    NetworkService.activeNetwork = network

    // TODO: remove this once network refactor is done
    setNetwork(network)
  }
})

export { listener }
