import {
  compileSolanaTx,
  serializeSolanaTx,
  SolanaProvider,
  transferSol,
  transferToken
} from '@avalabs/core-wallets-sdk'
import {
  RpcMethod,
  TokenType,
  TokenWithBalanceSPL,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { resolve } from '@avalabs/core-utils-sdk'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { SPAN_STATUS_ERROR } from '@sentry/core'

export const send = async ({
  request,
  fromAddress,
  provider,
  token,
  toAddress,
  amount
}: {
  request: Request
  fromAddress: string
  provider: SolanaProvider
  token: TokenWithBalanceSVM
  toAddress: string
  amount?: bigint
}): Promise<string> => {
  const sentrySpanName = 'send-token'

  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.send' },
    async span => {
      try {
        const tx = await buildTx({
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
                account: fromAddress,
                serializedTx: serializeSolanaTx(compiledTx)
              }
            ]
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
        console.log(error)
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

const buildTx = async ({
  fromAddress,
  toAddress,
  amount,
  token,
  provider
}: {
  fromAddress: string
  toAddress: string
  amount?: bigint
  token: TokenWithBalanceSVM | TokenWithBalanceSPL
  provider: SolanaProvider
}): Promise<any> => {
  if (amount !== undefined) {
    if (token.type === TokenType.NATIVE) {
      return transferSol({
        from: fromAddress,
        to: toAddress,
        amount: amount,
        provider
      })
    }

    return transferToken({
      from: fromAddress,
      to: toAddress,
      mint: token.address,
      amount: amount,
      decimals: token.decimals,
      provider
    })
  }
}
