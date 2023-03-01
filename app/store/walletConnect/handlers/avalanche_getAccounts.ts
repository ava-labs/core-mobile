import { AppListenerEffectAPI } from 'store'
import { selectAccounts, selectActiveAccount } from 'store/account'
import { RpcMethod } from 'store/walletConnectV2'
import { DappRpcRequest, HandleResponse, RpcRequestHandler } from './types'
import { mapAccountToCoreWebAccount } from './utils/account'

export type AvalancheGetAccountsRpcRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  []
>

class AvalancheGetAccountsHandler
  implements RpcRequestHandler<AvalancheGetAccountsRpcRequest, never>
{
  methods = [RpcMethod.AVALANCHE_GET_ACCOUNTS]

  handle = async (
    request: AvalancheGetAccountsRpcRequest,
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
