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
import { updateRequestStatus } from '../slice'
import { parseMessage } from './utils/message'
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
  data: string | undefined
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
    const { payload } = request

    if (!payload) {
      return { success: false, error: ethErrors.rpc.invalidParams() }
    }

    const { data } = parseMessage(payload)

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
