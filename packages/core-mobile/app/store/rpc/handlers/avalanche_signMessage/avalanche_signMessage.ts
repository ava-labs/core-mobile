import { AppListenerEffectAPI } from 'store/index'
import { RpcMethod } from 'store/rpc/types'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { rpcErrors } from '@metamask/rpc-errors'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import * as Sentry from '@sentry/react-native'
import { parseRequestParams } from 'store/rpc/handlers/avalanche_signMessage/utils'
import {
  AvalancheSignMessageResult,
  AvalancheSignMessageRpcRequest
} from 'store/rpc/handlers/avalanche_signMessage/types'
import { selectActiveAccount } from 'store/account/slice'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
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
        error: rpcErrors.invalidParams('avalanche_signMessage param is invalid')
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
      const isDeveloperMode = selectIsDeveloperMode(getState())
      // this is assumption that AVALANCHE_SIGN_MESSAGE is used only by X and P chains
      // so here we use one of those, doesn't matter which since both work on same address
      const network = NetworkService.getAvalancheNetworkX(isDeveloperMode)

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
      const error = rpcErrors.internal('Unable to sign message')
      Sentry.captureException(e, { tags: { dapps: 'avalancheSignMessage' } })
      return {
        success: false,
        error
      }
    }
  }
}

export const avalancheSignMessageHandler = new AvalancheSignMessageHandler()
