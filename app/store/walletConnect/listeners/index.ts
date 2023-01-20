import { isAnyOf } from '@reduxjs/toolkit'
import { setActiveAccountIndex } from 'store/account'
import { onLogOut, onRehydrationComplete } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { setActive } from 'store/network'
import {
  killSessions,
  newSession,
  onCallRequest,
  onDisconnect,
  onSessionRequest,
  onRequestApproved,
  onSendRpcError,
  onSendRpcResult
} from '../slice'
import { handleRequest, approveRequest } from './requests'
import { sendRpcResult, sendRpcError } from './responses'
import {
  startSession,
  restoreSessions,
  killAllSessions,
  killSomeSessions,
  updateSessions,
  handleDisconnect
} from './sessions'

export const addRpcListeners = (startListening: AppStartListening) => {
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
    matcher: isAnyOf(onSessionRequest, onCallRequest),
    effect: handleRequest
  })

  startListening({
    actionCreator: onRequestApproved,
    effect: approveRequest
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
