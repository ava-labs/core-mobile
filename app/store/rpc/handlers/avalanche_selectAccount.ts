import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import {
  Account,
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import {
  addRequest,
  sendRpcResult,
  sendRpcError,
  removeRequest
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

export interface AvalancheSelectAccountRequest
  extends DappRpcRequest<RpcMethod.AVALANCHE_SELECT_ACCOUNT, [number]> {
  data: { account: Account }
}

class AvalancheSelectAccountHandler
  implements RpcRequestHandler<AvalancheSelectAccountRequest>
{
  methods = [RpcMethod.AVALANCHE_SELECT_ACCOUNT]

  handle = async (
    action: PayloadAction<AvalancheSelectAccountRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch, getState } = listenerApi
    const { params } = action.payload

    const accountIndex = params?.[0]

    if (accountIndex === undefined) {
      dispatch(
        sendRpcError({
          request: action,
          error: ethErrors.rpc.invalidParams({
            message: 'missing param: accountIndex'
          })
        })
      )
      return
    }

    const activeAccount = selectActiveAccount(getState())
    const accounts = selectAccounts(getState())

    const accountAlreadyActive =
      activeAccount && activeAccount.index === accountIndex

    if (accountAlreadyActive) {
      dispatch(
        sendRpcResult({
          request: action,
          result: null
        })
      )
      return
    }

    const requestedAccount = accounts[accountIndex]

    if (requestedAccount === undefined) {
      dispatch(
        sendRpcError({
          request: action,
          error: ethErrors.rpc.resourceNotFound({
            message: 'requested account does not exist'
          })
        })
      )
      return
    }

    const dAppRequest: AvalancheSelectAccountRequest = {
      payload: action.payload,
      data: { account: requestedAccount }
    }

    dispatch(addRequest(dAppRequest))
  }

  onApprove = async (
    action: PayloadAction<
      { request: AvalancheSelectAccountRequest; result?: unknown },
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const request = action.payload.request
    const accountIndex = request.data.account.index

    dispatch(setActiveAccountIndex(accountIndex))

    dispatch(
      sendRpcResult({
        request,
        result: []
      })
    )

    dispatch(removeRequest(request.payload.id))
  }
}

export const avalancheSelectAccountHandler = new AvalancheSelectAccountHandler()
