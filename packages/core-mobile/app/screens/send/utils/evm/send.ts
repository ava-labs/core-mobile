import SentryWrapper from 'services/sentry/SentryWrapper'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { transactionRequestToTransactionParams } from 'store/rpc/utils/transactionRequestToTransactionParams'
import { RpcMethod, TokenWithBalanceEVM } from '@avalabs/vm-module-types'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionRequest } from 'ethers'
import { resolve } from '@avalabs/core-utils-sdk'
import { SpanName } from 'services/sentry/types'
import { SPAN_STATUS_ERROR } from '@sentry/core'
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
  const sentrySpanName = 'send-token'
  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.send' },
    async span => {
      try {
        const txRequest = await getTransactionRequest({
          fromAddress,
          provider,
          token,
          toAddress,
          amount,
          chainId,
          sentrySpanName
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
      } catch (error) {
        span?.setStatus({
          code: SPAN_STATUS_ERROR,
          message: error instanceof Error ? error.message : 'unknown error'
        })
        throw error
      } finally {
        span?.end()
      }
    }
  )
}
const getTransactionRequest = ({
  fromAddress,
  provider,
  chainId,
  token,
  toAddress,
  amount,
  sentrySpanName
}: {
  fromAddress: string
  provider: JsonRpcBatchInternal
  chainId: number
  token: TokenWithBalanceEVM
  toAddress: string
  amount?: bigint
  sentrySpanName: SpanName
}): Promise<TransactionRequest> => {
  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.evm.get_trx_request' },
    async () => {
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
    }
  )
}
