import { getCachedXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { selectActiveAccount } from 'store/account/slice'
import type { XPAddressDictionary } from 'store/account/types'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { selectIsFilterSmallUtxosActive } from 'store/settings/advanced/filterSmallUtxosActive'
import { selectWalletById } from 'store/wallet/slice'
import type { AppListenerEffectAPI } from 'store/types'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { createCctCallbacks } from './createCctCallbacks'

const EMPTY_XP_ADDRESSES = {
  xpAddresses: [] as string[],
  xpAddressDictionary: {} as XPAddressDictionary
}

/**
 * Builds the CCT callbacks against live Redux + React Query state so that
 * each invocation observes the latest account / wallet / xpAddresses. The
 * TransferManager doesn't need to be recreated when those change.
 *
 * `getXpAddresses` uses `getCachedXPAddresses` rather than a raw cache read
 * so that a cold cache fetches on demand — a cold-start swap flow with no
 * prior portfolio mount must not produce empty addresses (that would cause
 * `getInternalExternalAddrs` to return empty indices and break signing).
 */
export const buildCctDependencies = (
  listenerApi: AppListenerEffectAPI
): ReturnType<typeof createCctCallbacks> =>
  createCctCallbacks({
    getActiveAccount: () => selectActiveAccount(listenerApi.getState()),
    getIsDeveloperMode: () => selectIsDeveloperMode(listenerApi.getState()),
    getWallet: () => {
      const state = listenerApi.getState()
      const account = selectActiveAccount(state)
      if (!account) return undefined
      const wallet = selectWalletById(account.walletId)(state)
      return wallet ? { id: wallet.id, type: wallet.type } : undefined
    },
    getXpAddresses: async () => {
      const state = listenerApi.getState()
      const account = selectActiveAccount(state)
      if (!account) return EMPTY_XP_ADDRESSES
      const wallet = selectWalletById(account.walletId)(state)
      if (!wallet) return EMPTY_XP_ADDRESSES
      return getCachedXPAddresses({
        walletId: wallet.id,
        walletType: wallet.type,
        account,
        isDeveloperMode: selectIsDeveloperMode(state)
      })
    },
    request: createInAppRequest(listenerApi.dispatch, listenerApi.getState),
    getFilterSmallUtxos: () =>
      selectIsFilterSmallUtxosActive(listenerApi.getState())
  })
