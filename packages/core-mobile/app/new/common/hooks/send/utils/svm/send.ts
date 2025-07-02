import {
  compileSolanaTx,
  serializeSolanaTx,
  SolanaProvider
} from '@avalabs/core-wallets-sdk'
import { RpcMethod, TokenWithBalanceSVM } from '@avalabs/vm-module-types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { resolve } from '@avalabs/core-utils-sdk'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { SPAN_STATUS_ERROR } from '@sentry/core'
import { getSolanaCaip2ChainId } from 'utils/caip2ChainIds'
import { Account } from 'store/account'
import { buildSolanaTransaction } from './buildSolanaTransaction'

export const send = async ({
  request,
  fromAddress,
  provider,
  token,
  toAddress,
  amount,
  chainId,
  account,
  context
}: {
  request: Request
  fromAddress: string
  provider: SolanaProvider
  token: TokenWithBalanceSVM
  toAddress: string
  amount?: bigint
  chainId: number
  account: Account
  context?: Record<string, unknown>
}): Promise<string> => {
  const sentrySpanName = 'send-token'

  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.send' },
    async span => {
      try {
        const tx = await buildSolanaTransaction({
          fromAddress,
          toAddress,
          amount,
          token,
          provider
        })

        const compiledTx = compileSolanaTx(tx)
        const [txHash, txError] = await resolve(
          request({
            method: RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
            params: [
              {
                account: account.addressSVM,
                serializedTx: serializeSolanaTx(compiledTx)
              }
            ],
            chainId: getSolanaCaip2ChainId(chainId),
            context
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
