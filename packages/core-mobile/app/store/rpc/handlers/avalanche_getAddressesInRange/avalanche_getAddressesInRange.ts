import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod } from 'store/rpc/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getAddressesFromXpubXP } from 'utils/getAddressesFromXpubXP'
import { selectActiveWallet } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { selectActiveAccount } from 'store/account/slice'
import { stripXPPrefix } from 'utils/stripXPPrefix'
import { HandleResponse, RpcRequestHandler } from '../types'
import { AvalancheGetAddressesInRangeRpcRequest } from './types'

class AvalancheGetAddressesInRangeHandler
  implements RpcRequestHandler<AvalancheGetAddressesInRangeRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE]

  handle = async (
    request: AvalancheGetAddressesInRangeRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const state = getState()
    const activeWallet = selectActiveWallet(state)
    const isDeveloperMode = selectIsDeveloperMode(state)

    if (!activeWallet) {
      return {
        success: false,
        error: rpcErrors.internal('No active wallet')
      }
    }

    if (activeWallet.type === WalletType.PRIVATE_KEY) {
      const activeAccount = selectActiveAccount(state)

      if (!activeAccount) {
        return {
          success: false,
          error: rpcErrors.internal('No active account')
        }
      }

      return {
        success: true,
        value: {
          external: [stripXPPrefix(activeAccount.addressPVM)],
          internal: []
        }
      }
    }

    if (
      activeWallet.type === WalletType.SEEDLESS ||
      activeWallet.type === WalletType.LEDGER_LIVE
    ) {
      // for seedless and ledger live wallets,
      // return empty arrays for now until multi-address signing support is added
      // for the avalanche_sendTransaction RPC.
      // more details: https://ava-labs.atlassian.net/browse/CP-12347?focusedCommentId=58482
      return {
        success: true,
        value: {
          external: [],
          internal: []
        }
      }
    }

    try {
      const addresses = await getAddressesFromXpubXP({
        isDeveloperMode: isDeveloperMode,
        walletId: activeWallet.id,
        walletType: activeWallet.type
      })
      return { success: true, value: addresses }
    } catch (e) {
      return {
        success: false,
        error: rpcErrors.internal((e as Error).message)
      }
    }
  }
}

export const avalancheGetAddressesInRangeHandler =
  new AvalancheGetAddressesInRangeHandler()
