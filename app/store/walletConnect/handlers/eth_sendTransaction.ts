import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import { Transaction } from 'screens/rpc/util/types'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import walletService from 'services/wallet/WalletService'
import networkService from 'services/network/NetworkService'
import { AppListenerEffectAPI } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { selectNetworkFee, fetchNetworkFee } from 'store/networkFee'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { ethErrors } from 'eth-rpc-errors'
import * as Sentry from '@sentry/react-native'
import { updateRequestStatus } from '../slice'
import { RpcMethod } from '../types'
import {
  ApproveResponse,
  DappRpcRequest,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from './types'

export type TransactionParams = {
  from: string
  to: string
  value: string
  data: string
  gas?: number
  gasPrice?: string
}

type ApproveData = {
  transaction: Transaction | undefined
}

export type EthSendTransactionRpcRequest = DappRpcRequest<
  RpcMethod.ETH_SEND_TRANSACTION,
  TransactionParams[]
>

class EthSendTransactionHandler
  implements RpcRequestHandler<EthSendTransactionRpcRequest, ApproveData>
{
  methods = [RpcMethod.ETH_SEND_TRANSACTION]

  hasPostApprove = true

  handle = async (
    request: EthSendTransactionRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { dispatch } = listenerApi
    // TODO: do TX parsing and parameter verification here instead of in SignTransaction.tsx

    // fetch network fees for tx parsing and approval screen
    dispatch(fetchNetworkFee())

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SignTransaction,
        params: {
          request
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: EthSendTransactionRpcRequest
      data: ApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch, getState } = listenerApi
    const state = getState()
    const activeNetwork = selectActiveNetwork(state)
    const activeAccount = selectActiveAccount(state)
    const networkFees = selectNetworkFee(state)

    const request = payload.request
    const transaction = payload.data.transaction
    const params = transaction?.txParams

    if (!activeAccount || !transaction || !params) {
      return { success: false, error: ethErrors.rpc.internal('app not ready') }
    }

    const nonce = await getEvmProvider(activeNetwork).getTransactionCount(
      params.from
    )

    try {
      const evmParams = await txToCustomEvmTx(networkFees.low, params)

      const signedTx = await walletService.sign(
        {
          nonce,
          chainId: activeNetwork.chainId,
          gasPrice: evmParams.gasPrice,
          gasLimit: evmParams.gasLimit,
          data: evmParams.data,
          to: params.to,
          value: evmParams.value
        },
        activeAccount.index,
        activeNetwork
      )

      const transactionHash = await networkService.sendTransaction(
        signedTx,
        activeNetwork,
        true
      )

      dispatch(
        updateRequestStatus({
          id: request.payload.id,
          status: { result: transactionHash }
        })
      )

      return { success: true, value: transactionHash }
    } catch (e) {
      Logger.error('failed to approve transaction call', JSON.stringify(e))

      const error = ethErrors.rpc.internal<string>(
        'failed to approve transaction request'
      )

      dispatch(
        updateRequestStatus({
          id: request.payload.id,
          status: {
            error
          }
        })
      )

      Sentry.captureException(e, {
        tags: { dapps: 'signTransaction' }
      })

      return {
        success: false,
        error
      }
    }
  }
}

export const ethSendTransactionHandler = new EthSendTransactionHandler()
