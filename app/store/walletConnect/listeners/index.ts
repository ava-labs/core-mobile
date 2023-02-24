import { isAnyOf } from '@reduxjs/toolkit'
import { setActiveAccountIndex } from 'store/account'
import { onLogOut, onRehydrationComplete } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { setActive } from 'store/network'
import {
  killSessions,
  newSession,
  onDisconnect,
  onRequest,
  onSendRpcError,
  onSendRpcResult
} from '../slice'
import {
  startSession,
  restoreSessions,
  killAllSessions,
  killSomeSessions,
  updateSessions,
  handleDisconnect
} from './sessions'
import { processRequest } from './requests'
import { sendRpcResult, sendRpcError } from './responses'

export const addWCListeners = (startListening: AppStartListening) => {
  /*********************
   * SESSION LISTENERS *
   *********************/
  startListening({
    actionCreator: newSession,
    effect: startSession
  })

  startListening({
    actionCreator: onRehydrationComplete,
    effect: restoreSessions
  })

  // update sessions if active address or chain id changes
  startListening({
    matcher: isAnyOf(setActive, setActiveAccountIndex),
    effect: updateSessions
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

  /**************************
   * RPC REQUEST LISTENERS *
   *************************/
  startListening({
    actionCreator: onRequest,
    effect: processRequest
  })

  /**************************
   * RPC RESPONSE LISTENERS *
   *************************/
  startListening({
    actionCreator: onSendRpcResult,
    effect: sendRpcResult
  })

  startListening({
    actionCreator: onSendRpcError,
    effect: sendRpcError
  })
}
