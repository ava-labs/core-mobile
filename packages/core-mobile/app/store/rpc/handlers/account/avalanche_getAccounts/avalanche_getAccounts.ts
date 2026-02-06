import { AppListenerEffectAPI } from 'store/types'
import {
  selectAccountsByWalletId,
  selectActiveAccount
} from 'store/account/slice'
import { selectWalletById } from 'store/wallet/slice'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { getXpubXPIfAvailable } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import { getCachedXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { HandleResponse, RpcRequestHandler } from '../../types'

export type AvalancheGetAccountsRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNTS>

class AvalancheGetAccountsHandler
  implements RpcRequestHandler<AvalancheGetAccountsRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_ACCOUNTS]

  handle = async (
    _request: AvalancheGetAccountsRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const activeAccount = selectActiveAccount(state)
    const isDeveloperMode = selectIsDeveloperMode(state)

    if (!activeAccount) {
      return {
        success: false,
        error: rpcErrors.internal('no active account')
      }
    }

    const wallet = selectWalletById(activeAccount.walletId)(state)

    if (!wallet) {
      return {
        success: false,
        error: rpcErrors.internal('no active wallet')
      }
    }

    const accounts = selectAccountsByWalletId(state, activeAccount.walletId)

    // Process accounts and add xpubXP and xpAddresses where available
    const accountsArray = await Promise.all(
      accounts.map(async account => {
        const xpubXP = await getXpubXPIfAvailable({
          walletId: wallet.id,
          walletType: wallet.type,
          accountIndex: account.index
        })

        const { xpAddresses: addresses, xpAddressDictionary } =
          await getCachedXPAddresses({
            walletId: wallet.id,
            walletType: wallet.type,
            account,
            isDeveloperMode
          })

        const xpAddresses = addresses.map(address => ({
          address,
          index: xpAddressDictionary[address]?.index ?? 0
        }))

        return {
          ...account,
          walletType: wallet?.type,
          walletName: wallet?.name,
          xpubXP,
          xpAddresses,
          active: account.id === activeAccount.id
        }
      })
    )

    return { success: true, value: accountsArray }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
