import { createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit'
import { addNetworkListeners } from '../network'
import type { RootState, AppDispatch } from '../index'

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

const listener = createListenerMiddleware()

const startListening = listener.startListening as AppStartListening

addNetworkListeners(startListening)

export { listener }
