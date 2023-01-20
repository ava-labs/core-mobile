import { PayloadAction } from '@reduxjs/toolkit'
import { ethErrors } from 'eth-rpc-errors'
import walletService from 'services/wallet/WalletService'
import { AppListenerEffectAPI } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import Logger from 'utils/Logger'
import * as Sentry from '@sentry/react-native'
import {
  addRequest,
  onSendRpcResult,
  onSendRpcError,
  updateRequest,
  removeRequest
} from '../slice'
import { RpcMethod } from '../types'
import { parseMessage } from './utils/message'
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
  error?: Error
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

    if (!payload) {
      listenerApi.dispatch(
        onSendRpcError({
          request: action,
          error: ethErrors.rpc.invalidParams()
        })
      )
      return
    }

    const { data, from, password } = parseMessage(payload)

    const requestWithData: EthSignRpcRequest = {
      payload,
      data,
      from,
      password
    }
    listenerApi.dispatch(addRequest(requestWithData))
  }

  approve = async (
    action: PayloadAction<{ request: EthSignRpcRequest }, string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const state = listenerApi.getState()
    const { dispatch } = listenerApi
    const activeNetwork = selectActiveNetwork(state)
    const activeAccount = selectActiveAccount(state)
    const request = action.payload.request

    if (!activeAccount || !activeNetwork) {
      listenerApi.dispatch(
        onSendRpcError({
          request,
          error: ethErrors.rpc.internal('app not ready')
        })
      )
      return
    }

    await walletService
      .signMessage(
        request.payload.method,
        request.data,
        activeAccount.index,
        activeNetwork
      )
      .then(result => {
        dispatch(
          onSendRpcResult({
            request,
            result
          })
        )
        dispatch(removeRequest(request.payload.id))
      })
      .catch(e => {
        Logger.error('Error approving dapp tx', e)
        dispatch(
          updateRequest({
            ...action.payload.request,
            error: e
          })
        )
        dispatch(
          onSendRpcError({
            request,
            error: ethErrors.rpc.internal('failed to sign message')
          })
        )
        Sentry?.captureException(e, { tags: { dapps: 'signMessage' } })
      })
  }
}
export const ethSignHandler = new EthSignHandler()
