import { addListener, createListenerMiddleware } from '@reduxjs/toolkit'
import { addAppListeners } from 'store/app/listeners'
import { addBalanceListeners } from 'store/balance/listeners'
import { addAccountListeners } from 'store/account/listeners'
import { addPermissionsListeners } from 'store/permissions/listeners'
import { addNetworkListeners } from 'store/network/listeners'
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
import { AppAddListener, AppStartListening } from 'store/types'
import { addCurrencyListeners } from 'store/settings/currency/listeners'
import { addMeldListeners } from 'store/meld/listeners'
import { addBranchListeners } from 'store/branch/listener'
// Nest Egg disabled (CP-14058) — see addNestEggListeners call below
// import { addNestEggListeners } from 'store/nestEgg/listeners'
import { addFusionListeners } from 'new/features/swap/store/listeners'
import { startRecurringFailureWatcher } from 'new/features/recurringSwap/store/listeners'

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

addPermissionsListeners(startListening)

addNetworkListeners(startListening)

addUnifiedBridgeListeners(startListening)

addPosthogListeners(startListening)

addRpcListeners(startListening)

addWCListeners(startListening)

addNotificationsListeners(startListening)

addBrowserListener(startListening)

addSeedlessListeners(startListening)

addWatchlistListeners(startListening)

addAppearanceListeners(startListening)

addCurrencyListeners(startListening)

addMeldListeners(startListening)

addBranchListeners(startListening)

// Nest Egg disabled (CP-14058): feature unused and linked to a blank,
// un-dismissable modal on iOS. Commented out (not removed) so it can be
// re-enabled later.
// addNestEggListeners(startListening)

addFusionListeners(startListening)

// Recurring-swap step-based Redux listeners (fill / cancel / pause / unpause)
// were removed in Spec §A13 — the SDK now signs and broadcasts internally, so
// the hooks resolve directly with `{ txHash }` and fire their own
// analytics + invalidations. Only the failure-watcher / pending-action
// reconciler subscriber remains.
startRecurringFailureWatcher()

export const addAppListener = addListener as AppAddListener

export { listener }
