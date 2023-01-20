import { PayloadAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import { selectAccounts, selectActiveAccount } from 'store/account'
import { onSendRpcResult } from '../slice'
import { RpcMethod } from '../types'
import { DappRpcRequest, RpcRequestHandler } from './types'
import { mapAccountToCoreWebAccount } from './utils/account'

export type AvalancheGetAccountsRpcRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  []
>

class AvalancheGetAccountsHandler
  implements RpcRequestHandler<AvalancheGetAccountsRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_ACCOUNTS]

  handle = async (
    action: PayloadAction<AvalancheGetAccountsRpcRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const accounts = selectAccounts(listenerApi.getState())
    const activeAccount = selectActiveAccount(listenerApi.getState())

    listenerApi.dispatch(
      onSendRpcResult({
        request: { payload: action.payload },
        result: Object.values(accounts).map(account =>
          mapAccountToCoreWebAccount(account, activeAccount?.index ?? 0)
        )
      })
    )
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
