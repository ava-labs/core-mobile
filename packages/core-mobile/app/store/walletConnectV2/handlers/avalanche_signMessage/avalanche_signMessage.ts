import { AppListenerEffectAPI } from 'store'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { ethErrors } from 'eth-rpc-errors'
import { selectActiveAccount } from 'store/account'
import { RpcMethod, SessionRequest } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'
import { selectActiveNetwork } from 'store/network'
import WalletService from 'services/wallet/WalletService'
import * as Sentry from '@sentry/react-native'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'
import { parseRequestParams } from './utils'

type AvalancheSignMessageResult = string

export type AvalancheSignMessageApproveData = {
  message: string
  accountIndex: number
}

export type AvalancheSignMessageRpcRequest =
  SessionRequest<RpcMethod.AVALANCHE_SIGN_MESSAGE>

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
    const [message, accountIndex = 0] = parseResult.data
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
        accountIndex,
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
