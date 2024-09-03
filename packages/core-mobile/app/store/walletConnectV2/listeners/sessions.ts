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
import { selectActiveNetwork, setActive } from 'store/network'
import { selectActiveAccount, setActiveAccountIndex } from 'store/account'
import { UPDATE_SESSION_DELAY } from 'consts/walletConnect'
import { onRequest } from 'store/rpc/slice'
import { CorePrimaryAccount } from '@avalabs/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { killSessions, newSession, onDisconnect } from '../slice'
import { RpcMethod, RpcProvider } from '../../rpc/types'

const callbacks = (
  listenerApi: AppListenerEffectAPI
): WalletConnectCallbacks => {
  const { dispatch } = listenerApi

  return {
    onSessionProposal: data =>
      dispatch(
        onRequest({
          provider: RpcProvider.WALLET_CONNECT,
          method: RpcMethod.WC_SESSION_REQUEST,
          data
        })
      ),
    onSessionRequest: (data, peerMeta) =>
      dispatch(
        onRequest({
          provider: RpcProvider.WALLET_CONNECT,
          method: data.params.request.method as RpcMethod,
          data: {
            ...data,
            params: {
              ...data.params,
              request: {
                ...data.params.request,
                method: data.params.request.method as RpcMethod
              }
            }
          },
          peerMeta
        })
      ),
    onDisconnect: data => dispatch(onDisconnect(data))
  }
}

export const initWalletConnect = async (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  try {
    const state = listenerApi.getState()

    if (onRehydrationComplete.match(action)) {
      const walletState = selectWalletState(state)

      if (walletState === WalletState.NONEXISTENT) return
    }

    await WalletConnectService.init(callbacks(listenerApi))

    /**
     * update all sessions with active chainId and address so that dapps stay in sync with wallet.
     * this is crucial for dapps that use wagmi.
     *
     * notes: the delay is to allow dapps to settle down after the session is established. wallet connect se sdk also does the same.
     */
    const { chainId } = selectActiveNetwork(state)
    const account = selectActiveAccount(state)
    setTimeout(() => updateSessions({ chainId, account }), UPDATE_SESSION_DELAY)
  } catch (e) {
    Logger.error('Unable to init wallet connect v2', e)
  }
}

export const updateSessions = async ({
  chainId,
  account
}: {
  chainId: number
  account?: CorePrimaryAccount
}): Promise<void> => {
  try {
    if (!account) return

    await WalletConnectService.updateSessions({
      chainId,
      account
    })
  } catch (e) {
    Logger.error('Unable to update WC sessions', e)
  }
}

export const startSession = async (
  action: ReturnType<typeof newSession>
): Promise<void> => {
  const uri = action.payload

  try {
    await WalletConnectService.pair(uri)
  } catch (e) {
    Logger.error('Unable to pair with dapp', e)
    showSimpleToast('Unable to pair with dapp')
  }
}

export const killAllSessions = async (): Promise<void> =>
  WalletConnectService.killAllSessions()

export const killSomeSessions = async (
  action: ReturnType<typeof killSessions>
): Promise<void> => {
  const sessionsToKill = action.payload
  const topics = sessionsToKill.map(session => session.topic)

  WalletConnectService.killSessions(topics)
}

export const handleDisconnect = async (
  action: ReturnType<typeof onDisconnect>
): Promise<void> => {
  const peerMeta = action.payload

  InteractionManager.runAfterInteractions(() => {
    showSimpleToast(`${peerMeta.name} was disconnected`)
  })
}

export const handleNetworkChange = async (
  action: ReturnType<typeof setActive>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const account = selectActiveAccount(state)
  const chainId = action.payload

  updateSessions({ chainId, account })
}

export const handleAccountChange = async (
  _: ReturnType<typeof setActiveAccountIndex>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const { chainId } = selectActiveNetwork(state)
  const account = selectActiveAccount(state)

  updateSessions({ chainId, account })
}

export const handleNonEvmAccountsChange = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const account = selectActiveAccount(state)

  WalletConnectService.updateSessionsForNonEvm({
    account,
    isTestnet: isDeveloperMode
  })
}
