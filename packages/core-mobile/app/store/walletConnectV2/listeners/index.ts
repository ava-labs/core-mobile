import { isAnyOf } from '@reduxjs/toolkit'
import { onLogIn, onLogOut, onRehydrationComplete } from 'store/app/slice'
import { AppStartListening } from 'store/middleware/listener'
import { setActive } from 'store/network/slice'
import { setActiveAccountIndex } from 'store/account/slice'
import { killSessions, newSession, onDisconnect } from '../slice'
import {
  handleAccountChange,
  handleDisconnect,
  handleNetworkChange,
  initWalletConnect,
  killAllSessions,
  killSomeSessions,
  startSession
} from './sessions'

export const addWCListeners = (startListening: AppStartListening): void => {
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
}
