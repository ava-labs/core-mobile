import { AppListenerEffectAPI } from 'store/index'
import { RpcMethod } from 'store/rpc/types'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { ethErrors } from 'eth-rpc-errors'
import Logger from 'utils/Logger'
import { selectActiveNetwork } from 'store/network'
import WalletService from 'services/wallet/WalletService'
import * as Sentry from '@sentry/react-native'
import { parseRequestParams } from 'store/rpc/handlers/avalanche_signMessage/utils'
import {
  AvalancheSignMessageResult,
  AvalancheSignMessageRpcRequest
} from 'store/rpc/handlers/avalanche_signMessage/types'
import { selectActiveAccount } from 'store/account'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'

export type AvalancheSignMessageApproveData = {
  message: string
  accountIndex?: number
}

class AvalancheSignMessageHandler
  implements
    RpcRequestHandler<
      AvalancheSignMessageRpcRequest,
      never,
      AvalancheSignMessageResult,
      AvalancheSignMessageApproveData
    >
{
  methods = [RpcMethod.AVALANCHE_SIGN_MESSAGE]

  handle = async (
    request: AvalancheSignMessageRpcRequest,
    _: AppListenerEffectAPI
  ): HandleResponse<never> => {
    const parseResult = parseRequestParams(request.data.params.request.params)

    if (!parseResult.success) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'avalanche_signMessage param is invalid'
        })
      }
    }
    const [message, accountIndex] = parseResult.data
    const msgHex = Buffer.from(message, 'utf-8').toString('hex')
    const approveData: AvalancheSignMessageApproveData = {
      message: msgHex,
      accountIndex
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.AvalancheSignMessage,
        params: { request, data: approveData }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: AvalancheSignMessageRpcRequest
      data: AvalancheSignMessageApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse<AvalancheSignMessageResult> => {
    try {
      const { getState } = listenerApi
      const {
        request,
        data: { message, accountIndex }
      } = payload
      const activeAccount = selectActiveAccount(getState())
      const network = selectActiveNetwork(getState())

      if (!activeAccount) {
        throw new Error('Unable to submit transaction, no active account.')
      }
      const encodedMessage = await WalletService.signMessage({
        rpcMethod: request.method,
        data: message,
        accountIndex: accountIndex ?? activeAccount.index,
        network
      })
      return { success: true, value: encodedMessage }
    } catch (e) {
      Logger.error('Failed to sign message', e)
      const error = ethErrors.rpc.internal<string>('Unable to sign message')
      Sentry.captureException(e, { tags: { dapps: 'avalancheSignMessage' } })
      return {
        success: false,
        error
      }
    }
  }
}

export const avalancheSignMessageHandler = new AvalancheSignMessageHandler()
