import { resolve } from '@avalabs/core-utils-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { BitcoinSendTransactionParams } from '@avalabs/bitcoin-module'
import { getBitcoinCaip2ChainId } from 'utils/caip2ChainIds'
import { RpcMethod } from 'store/rpc'

export const send = async ({
  request,
  fromAddress,
  toAddress,
  amount,
  feeRate,
  isMainnet
}: {
  request: Request
  fromAddress: string
  toAddress: string
  amount: bigint
  feeRate: bigint
  isMainnet: boolean
}): Promise<string> => {
  return SentryWrapper.startSpan(
    { name: 'send-token', contextName: 'svc.send.send' },
    async () => {
      const params: BitcoinSendTransactionParams = {
        from: fromAddress,
        to: toAddress,
        amount: Number(amount),
        feeRate: Number(feeRate)
      }

      const [txHash, txError] = await resolve(
        request({
          method: RpcMethod.BITCOIN_SEND_TRANSACTION,
          params,
          chainId: getBitcoinCaip2ChainId(isMainnet)
        })
      )

      if (txError) {
        throw txError
      }

      if (!txHash || typeof txHash !== 'string') {
        throw new Error('invalid transaction hash')
      }

      return txHash
    }
  )
}
