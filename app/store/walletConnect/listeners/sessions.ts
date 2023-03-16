import { AppListenerEffectAPI } from 'store/index'
import {
  onRehydrationComplete,
  selectWalletState,
  WalletState
} from 'store/app'
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
import { RpcMethod } from 'store/walletConnectV2'
import {
  removeDApps,
  killSessions,
  onDisconnect,
  newSession,
  onRequest,
  removeDapp
} from '../slice'
import { selectApprovedDApps } from '../slice'

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

      dispatch(onRequest({ payload: request }))
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

      dispatch(onRequest({ payload: request }))
    },
    onDisconnect: (clientId: string, peerMeta: PeerMeta) =>
      dispatch(onDisconnect({ clientId, peerMeta }))
  }
}

export const startSession = async (
  action: ReturnType<typeof newSession>,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const activeNetwork = selectActiveNetwork(state)

  // do not start session if on BTC network
  if (activeNetwork.vmName === NetworkVMType.BITCOIN) {
    showSimpleToast(
      'Wallet Connect V1 is not supported on Bitcoin network. Please switch to a different network and try again!'
    )
  } else {
    const uri = action.payload
    WalletConnectService.startSession({ uri }, callbacks(listenerApi))
  }
}

export const restoreSessions = async (
  action: ReturnType<typeof onRehydrationComplete>,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const walletState = selectWalletState(state)
  const approvedDApps = selectApprovedDApps(state)

  if (approvedDApps.length === 0 || walletState === WalletState.NONEXISTENT)
    return

  WalletConnectService.restoreSessions(approvedDApps, callbacks(listenerApi))
}

export const updateSessions = async (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const activeAccount = selectActiveAccount(state)
  const activeNetwork = selectActiveNetwork(state)

  // we don't update session when switching to bitcoin network as bitcoin network is not supported
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
  action: ReturnType<typeof onDisconnect>,
  listenerApi: AppListenerEffectAPI
) => {
  const { clientId, peerMeta } = action.payload

  listenerApi.dispatch(removeDapp(clientId))

  InteractionManager.runAfterInteractions(() => {
    if (peerMeta?.name) {
      showSimpleToast(`${peerMeta.name} was disconnected`)
    }
  })
}
