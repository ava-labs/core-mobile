import { createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from 'store'
import { addAppListeners } from 'store/app'
import { addBalanceListeners } from 'store/balance'
import { addAccountListeners } from 'store/account'
import { addNetworkListeners } from 'store/network'
import { addNetworkFeeListeners } from 'store/networkFee'
import { addBridgeListeners } from 'store/bridge'
import { addPosthogListeners } from 'store/posthog/listeners'

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

const listener = createListenerMiddleware({
  onError: (error, errorInfo) => console.error(error, errorInfo)
})

const startListening = listener.startListening as AppStartListening

addAppListeners(startListening)

addBalanceListeners(startListening)

addAccountListeners(startListening)

addNetworkListeners(startListening)

addBridgeListeners(startListening)

addNetworkFeeListeners(startListening)

addPosthogListeners(startListening)

export { listener }
