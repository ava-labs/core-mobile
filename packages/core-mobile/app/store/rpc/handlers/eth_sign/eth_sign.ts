import { ethErrors } from 'eth-rpc-errors'
import WalletService from 'services/wallet/WalletService'
import { AppListenerEffectAPI } from 'store'
import Logger from 'utils/Logger'
import * as Sentry from '@sentry/react-native'
import { selectAccountByAddress } from 'store/account'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { selectNetwork } from 'store/network'
import { selectIsBlockaidTransactionValidationBlocked } from 'store/posthog'
import { RpcMethod, RpcProvider, RpcRequest } from '../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'
import { parseRequestParams } from './utils/parseRequestParams'
import { parseApproveData } from './utils/parseApproveData'
import { isAddressApproved } from './utils/isAddressApproved'
import {
  navigateToSignMessage,
  scanAndSignMessage
} from './utils/scanAndSignMessage'

export type EthSignRpcRequest = RpcRequest<
  | RpcMethod.ETH_SIGN
  | RpcMethod.PERSONAL_SIGN
  | RpcMethod.SIGN_TYPED_DATA
  | RpcMethod.SIGN_TYPED_DATA_V1
  | RpcMethod.SIGN_TYPED_DATA_V3
  | RpcMethod.SIGN_TYPED_DATA_V4
>

class EthSignHandler implements RpcRequestHandler<EthSignRpcRequest> {
  methods = [
    RpcMethod.ETH_SIGN,
    RpcMethod.PERSONAL_SIGN,
    RpcMethod.SIGN_TYPED_DATA,
    RpcMethod.SIGN_TYPED_DATA_V1,
    RpcMethod.SIGN_TYPED_DATA_V3,
    RpcMethod.SIGN_TYPED_DATA_V4
  ]

  handle = async (
    request: EthSignRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const { method, params } = request.data.params.request

    const result = parseRequestParams({ method, params })

    if (!result.success) {
      Logger.error('invalid message params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams('Invalid message params')
      }
    }

    const chainId = request.data.params.chainId

    // when provider is wallet connect we need to check
    // if the requested address is authorized
    if (request.provider === RpcProvider.WALLET_CONNECT) {
      const session = WalletConnectService.getSession(request.data.topic)

      if (!session) {
        return {
          success: false,
          error: ethErrors.rpc.internal('Session not found')
        }
      }

      const requestedAddress = `${chainId}:${result.data.address}`

      if (!isAddressApproved(requestedAddress, session.namespaces)) {
        return {
          success: false,
          error: ethErrors.provider.unauthorized(
            'Requested address is not authorized'
          )
        }
      }
    }

    const network = selectNetwork(Number(chainId.split(':')[1]))(state)

    if (!network)
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound('Network does not exist')
      }

    const account = selectAccountByAddress(result.data.address)(state)

    if (!account)
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound('Account does not exist')
      }

    const isValidationDisabled =
      selectIsBlockaidTransactionValidationBlocked(state)

    // TODO CP-4894 decode transaction data here instead of in SignTransaction component/useExplainTransaction hook
    if (isValidationDisabled) {
      navigateToSignMessage({
        request,
        data: result.data.data,
        network,
        account
      })
    } else {
      scanAndSignMessage({
        request,
        data: result.data.data,
        network,
        account,
        address: result.data.address
      })
    }

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (payload: {
    request: EthSignRpcRequest
    data?: unknown
  }): ApproveResponse => {
    const request = payload.request

    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const { data, network, account } = result.data

    try {
      const encodedMessage = await WalletService.signMessage({
        rpcMethod: request.method,
        data,
        accountIndex: account.index,
        network
      })

      return { success: true, value: encodedMessage }
    } catch (e) {
      Logger.error('Unable to sign message', e)

      const error = ethErrors.rpc.internal<string>('Unable to sign message')

      Sentry.captureException(e, { tags: { dapps: 'signMessageV2' } })

      return {
        success: false,
        error
      }
    }
  }
}

export const ethSignHandler = new EthSignHandler()
