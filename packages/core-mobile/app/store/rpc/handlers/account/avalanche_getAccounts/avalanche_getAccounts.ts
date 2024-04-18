import { AppListenerEffectAPI } from 'store'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { HandleResponse, RpcRequestHandler } from '../../types'
import { mapAccountToCoreWebAccount } from './utils'

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

    const coreWebAccounts = Object.values(accounts).map(account =>
      mapAccountToCoreWebAccount(account, activeAccount?.index ?? 0)
    )

    return { success: true, value: coreWebAccounts }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
