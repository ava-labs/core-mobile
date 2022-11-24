import { PayloadAction } from '@reduxjs/toolkit'
import { ethErrors } from 'eth-rpc-errors'
import { paramsToMessageParams } from 'screens/rpc/util/paramsToMessageParams'
import walletService from 'services/wallet/WalletService'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import Logger from 'utils/Logger'
import { addRequest, sendRpcResult, sendRpcError } from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

export interface EthSignRpcRequest
  extends DappRpcRequest<
    | RpcMethod.ETH_SIGN
    | RpcMethod.ETH_SIGN
    | RpcMethod.SIGN_TYPED_DATA
    | RpcMethod.SIGN_TYPED_DATA_V1
    | RpcMethod.SIGN_TYPED_DATA_V3
    | RpcMethod.SIGN_TYPED_DATA_V4
    | RpcMethod.PERSONAL_SIGN,
    string[]
  > {
  data?: string
  from?: string
  password?: string
}

class EthSignHandler implements RpcRequestHandler<EthSignRpcRequest> {
  methods = [
    RpcMethod.ETH_SIGN,
    RpcMethod.SIGN_TYPED_DATA,
    RpcMethod.SIGN_TYPED_DATA_V1,
    RpcMethod.SIGN_TYPED_DATA_V3,
    RpcMethod.SIGN_TYPED_DATA_V4,
    RpcMethod.PERSONAL_SIGN
  ]

  handle = async (
    action: PayloadAction<EthSignRpcRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { payload } = action

    const { data, from, password } = paramsToMessageParams(payload)

    const requestWithData: EthSignRpcRequest = {
      payload,
      data,
      from,
      password
    }

    listenerApi.dispatch(addRequest(requestWithData))
  }

  onApprove = async (
    action: PayloadAction<
      { request: EthSignRpcRequest; result?: unknown },
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const state = listenerApi.getState()
    const activeNetwork = selectActiveNetwork(state)
    const activeAccount = selectActiveAccount(state)
    const request = action.payload.request

    if (!activeAccount || !activeNetwork) {
      listenerApi.dispatch(
        sendRpcError({
          id: request.payload.id,
          error: ethErrors.rpc.internal('app not ready')
        })
      )
      return
    }
    const method = request.payload.method as RpcMethod
    const dataToSign = request.data

    await walletService
      .signMessage(method, dataToSign, activeAccount.index, activeNetwork)
      .then(result => {
        listenerApi.dispatch(
          sendRpcResult({
            id: request.payload.id,
            result: [result]
          })
        )
      })
      .catch(e => {
        Logger.error('Error approving dapp tx', e)
        listenerApi.dispatch(
          sendRpcError({
            id: request.payload.id,
            error: ethErrors.rpc.internal('failed to sign message')
          })
        )
      })
  }
}
export const ethSignHandler = new EthSignHandler()
