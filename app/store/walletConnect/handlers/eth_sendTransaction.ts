import { PayloadAction } from '@reduxjs/toolkit'
import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import { Transaction } from 'screens/rpc/util/types'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import walletService from 'services/wallet/WalletService'
import networkService from 'services/network/NetworkService'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { selectNetworkFee, fetchNetworkFee } from 'store/networkFee'
import Logger from 'utils/Logger'
import { ethErrors } from 'eth-rpc-errors'
import * as Sentry from '@sentry/react-native'
import {
  addRequest,
  sendRpcResult,
  sendRpcError,
  updateRequest
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

export type TransactionParams = {
  from: string
  to: string
  value: string
  data: string
  gas?: number
  gasPrice?: string
}

export interface EthSendTransactionRpcRequest
  extends DappRpcRequest<RpcMethod.ETH_SEND_TRANSACTION, TransactionParams[]> {
  transaction?: Transaction | null
  result?: string
  error?: Error
}
class EthSendTransactionHandler
  implements RpcRequestHandler<EthSendTransactionRpcRequest>
{
  methods = [RpcMethod.ETH_SEND_TRANSACTION]

  handle = async (
    action: PayloadAction<EthSendTransactionRpcRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    // TODO: do TX parsing and parameter verification here instead of in SignTransaction.tsx

    // fetch network fees for tx parsing and approval screen
    listenerApi.dispatch(fetchNetworkFee())
    listenerApi.dispatch(
      addRequest({
        payload: action.payload
      })
    )
  }

  onApprove = async (
    action: PayloadAction<
      { request: EthSendTransactionRpcRequest; result?: unknown },
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const state = listenerApi.getState()
    const { dispatch } = listenerApi
    const activeNetwork = selectActiveNetwork(state)
    const activeAccount = selectActiveAccount(state)
    const networkFees = selectNetworkFee(state)

    const params = (action.payload.result as Transaction)?.txParams
    if (!activeAccount || !activeNetwork || !params) {
      return Promise.reject({ error: 'not ready' })
    }

    const nonce = await getEvmProvider(activeNetwork).getTransactionCount(
      params.from
    )

    await txToCustomEvmTx(networkFees.low, params).then(evmParams => {
      walletService
        .sign(
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
        .then(signedTx => {
          return networkService.sendTransaction(signedTx, activeNetwork, true)
        })
        .then(resultHash => {
          dispatch(
            updateRequest({
              ...action.payload.request,
              transaction: action.payload.result as Transaction,
              result: resultHash
            })
          )
          dispatch(
            sendRpcResult({
              request: action.payload.request,
              result: resultHash
            })
          )
        })
        .catch(e => {
          Logger.error('failed to approve transaction call', JSON.stringify(e))
          dispatch(
            updateRequest({
              ...action.payload.request,
              transaction: action.payload.result as Transaction,
              error: e
            })
          )
          dispatch(
            sendRpcError({
              request: action.payload.request,
              error: ethErrors.rpc.internal(
                'failed to approve transaction request'
              )
            })
          )
          Sentry?.captureException(e, {
            tags: { dapps: 'signTransaction' }
          })
        })
    })
  }
}
export const ethSendTransactionHandler = new EthSendTransactionHandler()
