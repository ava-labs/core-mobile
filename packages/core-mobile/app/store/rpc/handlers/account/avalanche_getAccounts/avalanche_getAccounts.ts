import { AppListenerEffectAPI } from 'store/types'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { selectWalletById } from 'store/wallet/slice'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
import WalletService from 'services/wallet/WalletService'
import { getXpubXPIfAvailable } from 'utils/getAddressesFromXpubXP'
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
    const accounts = selectAccounts(state)
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

    // Process accounts and add xpubXP where available
    const accountsArray = await Promise.all(
      Object.values(accounts).map(async account => {
        const xpubXP = await getXpubXPIfAvailable({
          walletId: wallet.id,
          walletType: wallet.type,
          accountIndex: account.index
        })

        const xpAddresses = await WalletService.getXPExternalAddresses({
          account,
          walletId: wallet.id,
          walletType: wallet.type,
          isTestnet: isDeveloperMode
        })

        return {
          ...account,
          walletType: wallet.type,
          walletName: wallet.name,
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
