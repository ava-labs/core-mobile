import SentryWrapper from 'services/sentry/SentryWrapper'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { getEvmCaip2ChainId } from 'temp/caip2ChainIds'
import { Transaction } from '@sentry/react'
import { transactionRequestToTransactionParams } from 'store/rpc/utils/transactionRequestToTransactionParams'
import { RpcMethod, TokenWithBalanceEVM } from '@avalabs/vm-module-types'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionRequest } from 'ethers'
import { resolve } from '@avalabs/core-utils-sdk'
import { buildTx } from './buildEVMSendTx'

export const send = async ({
  request,
  chainId,
  fromAddress,
  provider,
  token,
  toAddress,
  amount
}: {
  request: Request
  chainId: number
  fromAddress: string
  provider: JsonRpcBatchInternal
  token: TokenWithBalanceEVM
  toAddress: string
  amount?: bigint
}): Promise<string> => {
  const sentryTrx = SentryWrapper.startTransaction('send-token')

  return SentryWrapper.createSpanFor(sentryTrx)
    .setContext('svc.send.send')
    .executeAsync(async () => {
      const txRequest = await getTransactionRequest({
        fromAddress,
        provider,
        token,
        toAddress,
        amount,
        chainId,
        sentryTrx
      })

      const txParams = transactionRequestToTransactionParams(txRequest)

      const [txHash, txError] = await resolve(
        request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: [txParams],
          chainId: getEvmCaip2ChainId(chainId)
        })
      )

      if (txError) {
        throw txError
      }

      if (!txHash || typeof txHash !== 'string') {
        throw new Error('invalid transaction hash')
      }

      return txHash
    })
    .finally(() => {
      SentryWrapper.finish(sentryTrx)
    })
}
const getTransactionRequest = ({
  fromAddress,
  provider,
  chainId,
  token,
  toAddress,
  amount,
  sentryTrx
}: {
  fromAddress: string
  provider: JsonRpcBatchInternal
  chainId: number
  token: TokenWithBalanceEVM
  toAddress: string
  amount?: bigint
  sentryTrx: Transaction
}): Promise<TransactionRequest> => {
  return SentryWrapper.createSpanFor(sentryTrx)
    .setContext('svc.send.evm.get_trx_request')
    .executeAsync(async () => {
      const txRequest = await buildTx({
        fromAddress,
        provider,
        token,
        toAddress,
        amount
      })

      return {
        ...txRequest,
        chainId
      }
    })
}
