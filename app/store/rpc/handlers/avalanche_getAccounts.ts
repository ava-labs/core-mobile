import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { Account, selectAccounts, selectActiveAccount } from 'store/account'
import { sendRpcResult } from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

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
      sendRpcResult({
        request: action,
        result: Object.values(accounts).map((account: Account) => ({
          index: account.index,
          name: account.title,
          addressC: account.address,
          addressBTC: account.addressBtc,
          active: account.index === activeAccount?.index
        }))
      })
    )
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
