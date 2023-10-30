import { isAnyOf } from '@reduxjs/toolkit'
import { onLogIn, onLogOut, onRehydrationComplete } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { setActive } from 'store/network'
import { setActiveAccountIndex } from 'store/account'
import {
  killSessions,
  newSession,
  onDisconnect,
  onSendRpcError,
  onSendRpcResult,
  onRequest
} from '../slice'
import {
  killAllSessions,
  killSomeSessions,
  handleDisconnect,
  startSession,
  initWalletConnect,
  handleNetworkChange,
  handleAccountChange
} from './sessions'
import { processRequest } from './requests'
import { sendRpcResult, sendRpcError } from './responses'

export const addWCListeners = (startListening: AppStartListening) => {
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
}
