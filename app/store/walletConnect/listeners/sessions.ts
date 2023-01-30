import { AppListenerEffectAPI } from 'store/index'
import { onLogIn } from 'store/app'
import WalletConnectService, {
  WalletConnectCallbacks
} from 'services/walletconnect/WalletConnectService'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { PeerMeta } from 'services/walletconnect/types'
import { AnyAction } from '@reduxjs/toolkit'
import { InteractionManager } from 'react-native'
import { showSimpleToast } from 'components/Snackbar'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import {
  removeDApps,
  killSessions,
  onDisconnect,
  newSession,
  addRequest
} from '../slice'
import { selectApprovedDApps } from '../slice'
import { RpcMethod } from '../types'

const callbacks = (
  listenerApi: AppListenerEffectAPI
): WalletConnectCallbacks => {
  const { dispatch } = listenerApi

  return {
    onSessionRequest: (peerId: string, payload: JsonRpcRequest) => {
      const peerInfo = payload.params[0]

      const request = {
        ...payload,
        method: RpcMethod.SESSION_REQUEST as RpcMethod.SESSION_REQUEST,
        peerMeta: {
          name: peerInfo?.peerMeta.name,
          url: peerInfo?.peerMeta.url,
          icons: peerInfo?.peerMeta.icons,
          description: peerInfo?.peerMeta.description
        },
        peerId
      }

      dispatch(addRequest({ payload: request }))
    },
    onCallRequest: (
      peerId: string,
      peerMeta: PeerMeta,
      payload: JsonRpcRequest
    ) => {
      const request = {
        ...payload,
        peerMeta,
        peerId: peerId
      }

      dispatch(addRequest({ payload: request }))
    },
    onDisconnect: (peerMeta: PeerMeta) => dispatch(onDisconnect(peerMeta))
  }
}

export const startSession = async (
  action: ReturnType<typeof newSession>,
  listenerApi: AppListenerEffectAPI
) => {
  const uri = action.payload
  WalletConnectService.startSession({ uri }, callbacks(listenerApi))
}

export const restoreSessions = async (
  action: ReturnType<typeof onLogIn>,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const approvedDApps = selectApprovedDApps(state)

  if (approvedDApps.length === 0) return

  WalletConnectService.restoreSessions(approvedDApps, callbacks(listenerApi))
}

export const updateSessions = async (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const activeAccount = selectActiveAccount(state)
  const activeNetwork = selectActiveNetwork(state)

  if (!activeAccount || activeNetwork.vmName === NetworkVMType.BITCOIN) return

  WalletConnectService.updateAllSessions(
    activeAccount.address,
    activeNetwork.chainId.toString()
  )
}

export const killAllSessions = () => {
  WalletConnectService.killAllSessions()
}

export const killSomeSessions = async (
  action: ReturnType<typeof killSessions>,
  listenerApi: AppListenerEffectAPI
) => {
  const sessionsToKill = action.payload
  const peerIds = sessionsToKill.map(session => session.peerId)

  await WalletConnectService.killSessions(peerIds)
  listenerApi.dispatch(removeDApps(peerIds))
}

export const handleDisconnect = async (
  action: ReturnType<typeof onDisconnect>
) => {
  const peerMeta = action.payload

  InteractionManager.runAfterInteractions(() => {
    if (peerMeta?.name) {
      showSimpleToast(`${peerMeta.name} was disconnected`, peerMeta.url)
    }
  })
}
