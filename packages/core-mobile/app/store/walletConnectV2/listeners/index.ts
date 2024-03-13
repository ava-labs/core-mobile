import { isAnyOf } from '@reduxjs/toolkit'
import { onLogIn, onLogOut, onRehydrationComplete } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { setActive } from 'store/network'
import { setActiveAccountIndex } from 'store/account'
import {
  killSessions,
  newSession,
  onDisconnect,
  onRequest,
  onSendRpcError,
  onSendRpcResult,
  waitForTransactionReceiptAsync
} from '../slice'
import { waitForTransactionReceiptAsync as handleWaitForTransactionReceiptAsync } from '../../../utils/waitForTransactionReceiptAsync'
import {
  handleAccountChange,
  handleDisconnect,
  handleNetworkChange,
  initWalletConnect,
  killAllSessions,
  killSomeSessions,
  startSession
} from './sessions'
import { processRequest } from './requests'
import { sendRpcError, sendRpcResult } from './responses'

export const addWCListeners = (startListening: AppStartListening): void => {
  /*********************
   * SESSION LISTENERS *
   *********************/
  startListening({
    matcher: isAnyOf(onRehydrationComplete, onLogIn),
    effect: initWalletConnect
  })

  startListening({
    actionCreator: newSession,
    effect: startSession
  })

  startListening({
    actionCreator: onLogOut,
    effect: killAllSessions
  })

  startListening({
    actionCreator: killSessions,
    effect: killSomeSessions
  })

  startListening({
    actionCreator: onDisconnect,
    effect: handleDisconnect
  })

  startListening({
    actionCreator: setActive,
    effect: handleNetworkChange
  })

  startListening({
    actionCreator: setActiveAccountIndex,
    effect: handleAccountChange
  })
  // /**************************
  //  * RPC REQUEST LISTENERS *
  //  *************************/
  startListening({
    actionCreator: onRequest,
    effect: processRequest
  })

  // /**************************
  //  * RPC RESPONSE LISTENERS *
  //  *************************/
  startListening({
    actionCreator: onSendRpcResult,
    effect: sendRpcResult
  })

  startListening({
    actionCreator: onSendRpcError,
    effect: sendRpcError
  })

  startListening({
    actionCreator: waitForTransactionReceiptAsync,
    effect: async (action, listenerApi) =>
      handleWaitForTransactionReceiptAsync(
        listenerApi,
        action.payload.txResponse,
        action.payload.requestId
      )
  })
}
