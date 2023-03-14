import { ethErrors } from 'eth-rpc-errors'
import walletService from 'services/wallet/WalletService'
import { AppListenerEffectAPI } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import * as Sentry from '@sentry/react-native'
import { RpcMethod } from 'store/walletConnectV2'
import { parseRequestParams } from 'store/walletConnectV2/handlers/eth_sign/utils/parseRequestParams'
import {
  TypedData,
  OldTypedData
} from 'store/walletConnectV2/handlers/eth_sign/schemas/ethSignTypedData'
import { updateRequestStatus } from '../slice'
import {
  ApproveResponse,
  DappRpcRequest,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from './types'

export type EthSignRpcRequest = DappRpcRequest<
  | RpcMethod.ETH_SIGN
  | RpcMethod.ETH_SIGN
  | RpcMethod.SIGN_TYPED_DATA
  | RpcMethod.SIGN_TYPED_DATA_V1
  | RpcMethod.SIGN_TYPED_DATA_V3
  | RpcMethod.SIGN_TYPED_DATA_V4
  | RpcMethod.PERSONAL_SIGN,
  string[]
>

type ApproveData = {
  data: string | TypedData | OldTypedData
}

class EthSignHandler
  implements RpcRequestHandler<EthSignRpcRequest, ApproveData>
{
  methods = [
    RpcMethod.ETH_SIGN,
    RpcMethod.SIGN_TYPED_DATA,
    RpcMethod.SIGN_TYPED_DATA_V1,
    RpcMethod.SIGN_TYPED_DATA_V3,
    RpcMethod.SIGN_TYPED_DATA_V4,
    RpcMethod.PERSONAL_SIGN
  ]

  handle = async (request: EthSignRpcRequest): HandleResponse => {
    const result = parseRequestParams({
      method: request.payload.method,
      params: request.payload.params
    })

    if (!result.success) {
      Logger.error('invalid message params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams('Invalid message params')
      }
    }

    const data = result.data.data

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SignMessage,
        params: {
          request,
          data
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: EthSignRpcRequest; data: ApproveData },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const state = listenerApi.getState()
    const { dispatch } = listenerApi
    const activeNetwork = selectActiveNetwork(state)
    const activeAccount = selectActiveAccount(state)
    const request = payload.request
    const data = payload.data.data

    if (!activeAccount) {
      return { success: false, error: ethErrors.rpc.internal('app not ready') }
    }

    try {
      const encodedMessage = await walletService.signMessage(
        request.payload.method,
        data,
        activeAccount.index,
        activeNetwork
      )

      return { success: true, value: encodedMessage }
    } catch (e) {
      Logger.error('Unable to sign message', e)

      const error = ethErrors.rpc.internal<string>('Unable to sign message')

      dispatch(
        updateRequestStatus({
          id: request.payload.id,
          status: {
            error
          }
        })
      )

      Sentry.captureException(e, { tags: { dapps: 'signMessage' } })

      return {
        success: false,
        error
      }
    }
  }
}

export const ethSignHandler = new EthSignHandler()
