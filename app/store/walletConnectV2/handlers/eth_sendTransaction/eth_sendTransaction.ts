import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import walletService from 'services/wallet/WalletService'
import networkService from 'services/network/NetworkService'
import { AppListenerEffectAPI } from 'store'
import { selectNetworkFee, fetchNetworkFee } from 'store/networkFee'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { ethErrors } from 'eth-rpc-errors'
import * as Sentry from '@sentry/react-native'
import { selectNetwork } from 'store/network'
import { selectAccountByAddress } from 'store/account'
import { updateRequestStatus } from '../../slice'
import { RpcMethod, SessionRequest } from '../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'
import { parseApproveData, parseRequestParams } from './utils'

export type EthSendTransactionRpcRequest =
  SessionRequest<RpcMethod.ETH_SEND_TRANSACTION>

class EthSendTransactionHandler
  implements RpcRequestHandler<EthSendTransactionRpcRequest>
{
  methods = [RpcMethod.ETH_SEND_TRANSACTION]

  handle = async (
    request: EthSendTransactionRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { dispatch } = listenerApi
    const { params } = request.data.params.request
    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Transaction params are invalid'
        })
      }
    }

    const transaction = result.data[0]

    // TODO CP-4894 decode transaction data here instead of in SignTransaction component/useExplainTransaction hook

    // fetch network fees for tx parsing and approval screen
    dispatch(fetchNetworkFee())

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SignTransactionV2,
        params: {
          request,
          transaction
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: EthSendTransactionRpcRequest
      data?: unknown
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch, getState } = listenerApi
    const state = getState()
    const networkFees = selectNetworkFee(state)

    const result = parseApproveData(payload.data)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const request = payload.request
    const chainId = request.data.params.chainId.split(':')[1]
    const params = result.data.txParams
    const address = params.from

    const network = selectNetwork(Number(chainId))(state)

    if (!network)
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound('Network does not exist')
      }

    const account = selectAccountByAddress(address)(state)

    if (!account)
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound('Account does not exist')
      }

    const nonce = await getEvmProvider(network).getTransactionCount(params.from)

    try {
      const evmParams = await txToCustomEvmTx(networkFees.low, params)

      const signedTx = await walletService.sign(
        {
          nonce,
          chainId: network.chainId,
          gasPrice: evmParams.gasPrice,
          gasLimit: evmParams.gasLimit,
          data: evmParams.data,
          to: params.to,
          value: evmParams.value
        },
        account.index,
        network
      )

      const transactionHash = await networkService.sendTransaction(
        signedTx,
        network,
        true
      )

      dispatch(
        updateRequestStatus({
          id: request.data.id,
          status: { result: transactionHash }
        })
      )

      return { success: true, value: transactionHash }
    } catch (e) {
      Logger.error('Unable to approve transaction request', JSON.stringify(e))

      const error = ethErrors.rpc.internal<string>(
        'Unable to approve transaction request'
      )

      dispatch(
        updateRequestStatus({
          id: request.data.id,
          status: {
            error
          }
        })
      )

      Sentry.captureException(e, {
        tags: { dapps: 'signTransactionV2' }
      })

      return {
        success: false,
        error
      }
    }
  }
}

export const ethSendTransactionHandler = new EthSendTransactionHandler()
