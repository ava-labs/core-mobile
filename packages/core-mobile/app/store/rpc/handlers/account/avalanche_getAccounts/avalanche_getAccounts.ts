import { AppListenerEffectAPI } from 'store/types'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
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
    if (!activeAccount)
      return {
        success: false,
        error: rpcErrors.internal('no active account')
      }

    const accountsArray = Object.values(accounts).map(account => {
      return {
        ...account,
        active: account.id === activeAccount.id
      }
    })
    return { success: true, value: accountsArray }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
