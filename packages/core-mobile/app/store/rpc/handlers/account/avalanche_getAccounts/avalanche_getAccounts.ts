import { AppListenerEffectAPI } from 'store'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
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
    const accounts = selectAccounts(listenerApi.getState())
    const activeAccount = selectActiveAccount(listenerApi.getState())
    if (!activeAccount) throw new Error('no active account')

    const accountsArray = Object.values(accounts).map(account => {
      account.active = account.index === activeAccount?.index
      account.walletId = 'test' //TODO: implement this properly
      return account
    })
    return { success: true, value: accountsArray }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
