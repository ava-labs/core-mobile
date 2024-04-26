import { AppListenerEffectAPI } from 'store'
import { selectActiveAccount } from 'store/account/slice'
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
    const activeAccount = selectActiveAccount(listenerApi.getState())

    return { success: true, value: activeAccount }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
