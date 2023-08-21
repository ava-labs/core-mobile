import {
  addListener,
  createListenerMiddleware,
  TypedAddListener,
  TypedStartListening
} from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from 'store'
import { addAppListeners } from 'store/app/listeners'
import { addBalanceListeners } from 'store/balance/listeners'
import { addAccountListeners } from 'store/account/listeners'
import { addNetworkListeners } from 'store/network/listeners'
import { addNetworkFeeListeners } from 'store/networkFee/index'
import { addBridgeListeners } from 'store/bridge/listeners'
import { addPosthogListeners } from 'store/posthog/listeners'
import { addWatchlistListeners } from 'store/watchlist/listeners'
import { addNftListeners } from 'store/nft/listeners'
import { addWCListeners as addWCListenersV1 } from 'store/walletConnect/listeners'
import { addWCListeners as addWCListenersV2 } from 'store/walletConnectV2/listeners'
import Logger from 'utils/Logger'
import { addNotificationsListeners } from 'store/notifications/listeners/listeners'

export type AppStartListening = TypedStartListening<RootState, AppDispatch>
export type AppAddListener = TypedAddListener<RootState, AppDispatch>

const listener = createListenerMiddleware({
  onError: (error, errorInfo) => {
    Logger.error('redux listener error', error)
    Logger.info('redux listener errorInfo', errorInfo)
  }
})

const startListening = listener.startListening as AppStartListening

addAppListeners(startListening)

addBalanceListeners(startListening)

addAccountListeners(startListening)

addNetworkListeners(startListening)

addNftListeners(startListening)

addBridgeListeners(startListening)

addNetworkFeeListeners(startListening)

addPosthogListeners(startListening)

addWatchlistListeners(startListening)

addWCListenersV1(startListening)

addWCListenersV2(startListening)

addNotificationsListeners(startListening)

export const addAppListener = addListener as AppAddListener

export { listener }
