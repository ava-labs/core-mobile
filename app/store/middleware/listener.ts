import { createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from 'store'
import { addAppListeners } from 'store/app'
import { addNetworkListeners } from 'store/network'
import { addBalanceListeners } from 'store/balance'

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

const listener = createListenerMiddleware()

const startListening = listener.startListening as AppStartListening

addAppListeners(startListening)

addNetworkListeners(startListening)

addBalanceListeners(startListening)

export { listener }
