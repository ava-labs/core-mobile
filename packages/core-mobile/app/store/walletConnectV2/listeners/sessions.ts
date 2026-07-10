import { AppListenerEffectAPI } from 'store/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { InteractionManager } from 'react-native'
import { parseUri } from '@walletconnect/utils'
import Logger from 'utils/Logger'
import {
  onRehydrationComplete,
  selectWalletState,
  WalletState
} from 'store/app'
import { AnyAction } from '@reduxjs/toolkit'
import { WalletConnectCallbacks } from 'services/walletconnectv2/types'
import { selectActiveNetwork, setActive } from 'store/network'
import { Account, selectActiveAccount, setActiveAccountId } from 'store/account'
import { UPDATE_SESSION_DELAY } from 'consts/walletConnect'
import { onRequest } from 'store/rpc/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isCoreDomain } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { showSnackbar, transactionSnackbar } from 'new/common/utils/toast'
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
  account?: Account
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

/**
 * A wc:v2 pairing uri carries its own `expiryTimestamp` (unix seconds); it is
 * absent on legacy/v1 uris. The in-app browser re-surfaces stored `wc:` links
 * on navigation, so an already-expired uri can be re-delivered here many times.
 * Pairing with an expired uri throws and previously spammed "Failed to pair
 * with dApp" toasts (CORE-REACT-NATIVE-62P), so we short-circuit it and show a
 * single deduped, friendly snackbar instead of the generic error toast.
 */
const isExpiredWcUri = (uri: string): boolean => {
  try {
    const { expiryTimestamp } = parseUri(uri)
    // `expiryTimestamp` is unix seconds. Treat at-or-past expiry as expired
    // (`<=`) — marginally more conservative than the SDK's strict `<`, so a
    // just-expired uri is skipped rather than attempted; the two only disagree
    // when `Date.now()` lands exactly on the expiry-second boundary.
    return expiryTimestamp !== undefined && expiryTimestamp * 1000 <= Date.now()
  } catch {
    // if the uri can't be parsed, let WalletConnectService.pair validate it as before
    return false
  }
}

// Tracks expired uris we've already surfaced a toast for, so a background dapp
// tab replaying the same stale uri can inform the user at most once instead of
// spamming (CORE-REACT-NATIVE-62P). Bounded so a page that mints many distinct
// expired uris can't grow it unbounded across a session; oldest entries evict
// first (insertion-ordered Set), and it's cleared entirely on logout.
const EXPIRED_URI_TOAST_CACHE_LIMIT = 100
const expiredUrisToasted = new Set<string>()

const markExpiredUriToasted = (uri: string): void => {
  if (expiredUrisToasted.size >= EXPIRED_URI_TOAST_CACHE_LIMIT) {
    const oldest = expiredUrisToasted.values().next().value
    if (oldest !== undefined) expiredUrisToasted.delete(oldest)
  }
  expiredUrisToasted.add(uri)
}

export const startSession = async (
  action: ReturnType<typeof newSession>
): Promise<void> => {
  const uri = action.payload

  if (isExpiredWcUri(uri)) {
    Logger.info('skipping pair for expired wallet connect uri')
    if (!expiredUrisToasted.has(uri)) {
      markExpiredUriToasted(uri)
      showSnackbar(
        'This connection link has expired. Please try connecting again.'
      )
    }
    return
  }

  try {
    await WalletConnectService.pair(uri)
  } catch (e) {
    Logger.error('Unable to pair with dapp', e)
    transactionSnackbar.error({
      message: 'Failed to pair with dApp',
      error: (e as Error).message
    })
  }
}

export const killAllSessions = async (): Promise<void> => {
  // forget expired-uri toast history on logout so it can't grow across accounts
  expiredUrisToasted.clear()
  return WalletConnectService.killAllSessions()
}

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
    showSnackbar(`${peerMeta.name} was disconnected`)
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
  _: ReturnType<typeof setActiveAccountId>,
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

  if (!account) {
    Logger.info(
      'skipping updating sessions for non evm namespaces due to no active account'
    )
    return
  }

  const promises: Promise<void>[] = []

  WalletConnectService.getSessions().forEach(session => {
    const isCoreApp = isCoreDomain(session.peer.metadata.url)

    if (!isCoreApp) {
      Logger.info(
        `skipping updating WC session '${session.peer.metadata.name}' with non evm chains since it is not a core app`
      )
      return
    }

    const promise = WalletConnectService.updateSessionWithTimeoutForNonEvm({
      session,
      account,
      isTestnet: isDeveloperMode
    })
    promises.push(promise)
  })
  await Promise.allSettled(promises)
}
