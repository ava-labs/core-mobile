import { AppListenerEffectAPI } from 'store/index'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { InteractionManager } from 'react-native'
import { showSimpleToast } from 'components/Snackbar'
import Logger from 'utils/Logger'
import {
  onRehydrationComplete,
  selectWalletState,
  WalletState
} from 'store/app'
import { AnyAction } from '@reduxjs/toolkit'
import { WalletConnectCallbacks } from 'services/walletconnectv2/types'
import { killSessions, newSession, onDisconnect, onRequest } from '../slice'
import { RpcMethod } from '../types'

const callbacks = (
  listenerApi: AppListenerEffectAPI
): WalletConnectCallbacks => {
  const { dispatch } = listenerApi

  return {
    onSessionProposal: data =>
      dispatch(
        onRequest({
          method: RpcMethod.SESSION_REQUEST,
          data
        })
      ),
    onSessionRequest: (data, session) =>
      dispatch(
        onRequest({
          method: data.params.request.method,
          data,
          session
        })
      ),
    onDisconnect: data => dispatch(onDisconnect(data))
  }
}

export const initWalletConnect = async (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
) => {
  try {
    if (onRehydrationComplete.match(action)) {
      const state = listenerApi.getState()
      const walletState = selectWalletState(state)

      if (walletState === WalletState.NONEXISTENT) return
    }

    await WalletConnectService.init(callbacks(listenerApi))
  } catch (e) {
    Logger.error('Unable to init wallet connect', e)
  }
}

export const startSession = async (action: ReturnType<typeof newSession>) => {
  const uri = action.payload

  try {
    await WalletConnectService.pair(uri)
  } catch (e) {
    Logger.error('Unable to pair with dapp', e)
    showSimpleToast('Unable to pair with dapp')
  }
}

export const killAllSessions = async () =>
  WalletConnectService.killAllSessions()

export const killSomeSessions = async (
  action: ReturnType<typeof killSessions>
) => {
  const sessionsToKill = action.payload
  const topics = sessionsToKill.map(session => session.topic)

  WalletConnectService.killSessions(topics)
}

export const handleDisconnect = async (
  action: ReturnType<typeof onDisconnect>
) => {
  const peerMeta = action.payload

  InteractionManager.runAfterInteractions(() => {
    showSimpleToast(`${peerMeta.name} was disconnected`)
  })
}
