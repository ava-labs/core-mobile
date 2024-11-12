import { AppListenerEffectAPI } from 'store'
import { WalletState, onAppUnlocked, selectWalletState } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { toggleDeveloperMode } from 'store/settings/advanced'
import { isAnyOf } from '@reduxjs/toolkit'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { setFeatureFlags } from 'store/posthog'
import { showTransactionSuccessToast } from 'utils/toast'
import Logger from 'utils/Logger'
import {
  removePendingTransfer,
  selectPendingTransfers,
  setPendingTransfer
} from './slice'

const showSuccessToast = (tx: BridgeTransfer): void => {
  showTransactionSuccessToast({
    message: 'Bridge Successful',
    txHash: tx.sourceTxHash
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

export const initUnifiedBridgeService = async (
  action: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const walletState = selectWalletState(state)

  // No need to proceed if the wallet is not unlocked
  if (walletState !== WalletState.ACTIVE) return

  const initialized = await UnifiedBridgeService.init({
    listenerApi
  })

  if (initialized) {
    trackPendingTransfers(listenerApi)
  }
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

  if (transfer.errorCode) {
    Logger.error('bridge unsuccessful', new Error(`${transfer.errorCode}`))
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
