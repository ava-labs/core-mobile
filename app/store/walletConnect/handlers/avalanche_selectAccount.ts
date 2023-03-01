import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import {
  Account,
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { RpcMethod } from 'store/walletConnectV2'
import {
  ApproveResponse,
  DappRpcRequest,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from './types'

type ApproveData = {
  account: Account
}

export type AvalancheSelectAccountRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_SELECT_ACCOUNT,
  [number]
>

class AvalancheSelectAccountHandler
  implements RpcRequestHandler<AvalancheSelectAccountRequest, ApproveData>
{
  methods = [RpcMethod.AVALANCHE_SELECT_ACCOUNT]

  handle = async (
    request: AvalancheSelectAccountRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const { params } = request.payload

    const accountIndex = params?.[0]

    if (accountIndex === undefined) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'missing param: accountIndex'
        })
      }
    }

    const activeAccount = selectActiveAccount(getState())
    const accounts = selectAccounts(getState())

    const accountAlreadyActive =
      activeAccount && activeAccount.index === accountIndex

    if (accountAlreadyActive) {
      return { success: true, value: null }
    }

    const requestedAccount = accounts[accountIndex]

    if (requestedAccount === undefined) {
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound({
          message: 'requested account does not exist'
        })
      }
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SelectAccount,
        params: {
          request,
          account: requestedAccount
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheSelectAccountRequest; data: ApproveData },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const accountIndex = payload.data.account.index

    dispatch(setActiveAccountIndex(accountIndex))

    return { success: true, value: [] }
  }
}

export const avalancheSelectAccountHandler = new AvalancheSelectAccountHandler()
