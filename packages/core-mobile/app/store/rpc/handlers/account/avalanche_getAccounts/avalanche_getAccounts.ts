import { AppListenerEffectAPI } from 'store/types'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { selectActiveWallet } from 'store/wallet/slice'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
import WalletService from 'services/wallet/WalletService'
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
    const activeWallet = selectActiveWallet(state)
    const activeAccount = selectActiveAccount(state)
    if (!activeWallet) {
      return {
        success: false,
        error: rpcErrors.internal('no active wallet')
      }
    }

    if (!activeAccount) {
      return {
        success: false,
        error: rpcErrors.internal('no active account')
      }
    }

    // Process accounts and add xpubXP where available
    const accountsArray = await Promise.all(
      Object.values(accounts).map(async account => {
        let xpubXP

        try {
          xpubXP = await WalletService.getRawXpubXP({
            walletId: activeWallet.id,
            walletType: activeWallet.type,
            accountIndex: account.index
          })
        } catch (error) {
          xpubXP = undefined
        }

        return {
          ...account,
          walletType: activeWallet.type,
          walletName: activeWallet.name,
          xpubXP,
          active: account.id === activeAccount.id
        }
      })
    )

    return { success: true, value: accountsArray }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
