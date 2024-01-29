import React from 'react'
import { AppListenerEffectAPI } from 'store'
import { WalletState, onAppUnlocked, selectWalletState } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { isAnyOf } from '@reduxjs/toolkit'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import {
  BridgeTransfer,
  BridgeType,
  Environment
} from '@avalabs/bridge-unified'
import {
  selectIsUnifiedBridgeCCTPBlocked,
  setFeatureFlags
} from 'store/posthog'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import {
  removePendingTransfer,
  selectPendingTransfers,
  setPendingTransfer
} from './slice'

const showSuccessToast = (tx: BridgeTransfer): void => {
  showSnackBarCustom({
    component: (
      <TransactionToast
        message={'Bridge Successful'}
        type={TransactionToastType.SUCCESS}
        txHash={tx.sourceTxHash}
      />
    ),
    duration: 'short'
  })
}

const trackPendingTransfers = (listenerApi: AppListenerEffectAPI): void => {
  const state = listenerApi.getState()
  const pendingTransfers = selectPendingTransfers(state)

  Object.values(pendingTransfers).forEach(transfer => {
    try {
      if (transfer.completedAt) {
        listenerApi.dispatch(removePendingTransfer(transfer.sourceTxHash))
        showSuccessToast(transfer)
      } else {
        const updateListener = (updatedTransfer: BridgeTransfer): void => {
          // update the transaction, even if it's complete
          // (we want to keep the tx up to date, because some Component(i.e. BridgeTransactionStatus) has local state that depends on it)
          listenerApi.dispatch(setPendingTransfer(updatedTransfer))

          if (transfer.completedAt) {
            listenerApi.dispatch(removePendingTransfer(transfer.sourceTxHash))
            showSuccessToast(transfer)
          }
        }
        UnifiedBridgeService.trackTransfer(transfer, updateListener)
      }
    } catch {
      // Unified Bridge SDK may raise an error if we're asking about a transfer
      // while we're on the wrong environment (it won't find it).
      // We do nothing when it happens. Just let it be - we'll track this transfer
      // when user switches back to mainnet/testnet.
    }
  })
}

const initUnifiedBridgeService = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const walletState = selectWalletState(state)

  // if wallet is not unlocked yet, no need to do anything
  if (walletState !== WalletState.ACTIVE) return

  const cctpBlocked = selectIsUnifiedBridgeCCTPBlocked(state)

  if (UnifiedBridgeService.isInitialized()) {
    // if the service is already initialized
    // we only re-init it if the unified bridge cctp flag has changed
    const prevState = listenerApi.getOriginalState()
    const prevCctpBlocked = selectIsUnifiedBridgeCCTPBlocked(prevState)

    if (cctpBlocked === prevCctpBlocked) return
  }

  const isDeveloperMode = selectIsDeveloperMode(state)
  const environment = isDeveloperMode ? Environment.TEST : Environment.PROD

  const disabledBridgeTypes = [...(cctpBlocked ? [BridgeType.CCTP] : [])]

  await UnifiedBridgeService.init({ environment, disabledBridgeTypes })

  trackPendingTransfers(listenerApi)
}

const checkTransferStatus = async (
  action: ReturnType<typeof setPendingTransfer>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const transfer = action.payload

  if (transfer.completedAt) {
    listenerApi.dispatch(removePendingTransfer(transfer.sourceTxHash))
    showSuccessToast(transfer)
  }
}

export const addUnifiedBridgeListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode, setFeatureFlags),
    effect: initUnifiedBridgeService
  })

  startListening({
    actionCreator: setPendingTransfer,
    effect: checkTransferStatus
  })
}
