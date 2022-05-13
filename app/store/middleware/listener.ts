import { createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit'
import NetworkService from 'services/network/NetworkService'
import { onStorageReady } from '../actions'
import { setActive, selectActiveNetwork } from '../network'
import type { RootState, AppDispatch } from '../index'

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

const listener = createListenerMiddleware()

const startListening = listener.startListening as AppStartListening

// app lifecycle listeners
startListening({
  actionCreator: onStorageReady,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    NetworkService.onStorageReady(state)
  }
})

// network listeners
startListening({
  actionCreator: setActive,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    const network = selectActiveNetwork(state)
    NetworkService.activeNetwork = network
  }
})

export { listener }
