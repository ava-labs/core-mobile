import { AppListenerEffectAPI } from 'store/types'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { selectWalletById } from 'store/wallet/slice'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { WalletType } from 'services/wallet/types'
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
    const activeAccount = selectActiveAccount(state)

    if (!activeAccount) {
      return {
        success: false,
        error: rpcErrors.internal('no active account')
      }
    }

    // Helper function to get xpubXP for supported wallet types
    const getXpubXP = async (
      walletId: string,
      walletType: WalletType
    ): Promise<string | undefined> => {
      try {
        return await WalletService.getRawXpubXP({
          walletId,
          walletType,
          accountIndex: activeAccount.index
        })
      } catch (error) {
        return undefined
      }
    }

    // Process accounts and add xpubXP where available
    const accountsArray = await Promise.all(
      Object.values(accounts).map(async account => {
        const wallet = selectWalletById(account.walletId)(state)
        const xpubXP = wallet
          ? await getXpubXP(account.walletId, wallet.type)
          : undefined

        return {
          ...account,
          walletType: wallet?.type,
          walletName: wallet?.name,
          xpubXP,
          active: account.id === activeAccount.id
        }
      })
    )

    return { success: true, value: accountsArray }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
