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
import { addBridgeListeners } from 'store/bridge/listeners'
import { addBrowserListener } from 'store/browser/listener'
import { addPosthogListeners } from 'store/posthog/listeners'
import { addWCListeners } from 'store/walletConnectV2/listeners'
import { addRpcListeners } from 'store/rpc/listeners'
import Logger from 'utils/Logger'
import { addNotificationsListeners } from 'store/notifications/listeners/listeners'
import { addSeedlessListeners } from 'seedless/store/listeners'
import { addWatchlistListeners } from 'store/watchlist/listeners'
import { addAppearanceListeners } from 'store/settings/appearance/listeners'
import { addUnifiedBridgeListeners } from 'store/unifiedBridge/listeners'

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

addBridgeListeners(startListening)

addUnifiedBridgeListeners(startListening)

addPosthogListeners(startListening)

addRpcListeners(startListening)

addWCListeners(startListening)

addNotificationsListeners(startListening)

addBrowserListener(startListening)

addSeedlessListeners(startListening)

addWatchlistListeners(startListening)

addAppearanceListeners(startListening)

export const addAppListener = addListener as AppAddListener

export { listener }
