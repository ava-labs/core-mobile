import { Network } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { resolve } from '@avalabs/core-utils-sdk'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { getAvalancheCaip2ChainId } from 'utils/caip2ChainIds'
import { AvalancheSendTransactionParams } from '@avalabs/avalanche-module'
import { stripChainAddress } from 'store/account/utils'
import WalletService from 'services/wallet/WalletService'
import { utils } from '@avalabs/avalanchejs'
import { SpanName } from 'services/sentry/types'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { SPAN_STATUS_ERROR } from '@sentry/core'
import { RpcMethod } from '@avalabs/vm-module-types'
import { AvmCapableAccount } from 'common/hooks/send/utils/types'
import { WalletType } from 'services/wallet/types'
import { getInternalExternalAddrs } from '../getInternalExternalAddrs'

export const send = async ({
  walletId,
  walletType,
  request,
  fromAddress,
  account,
  network,
  toAddress,
  amount
}: {
  walletId: string
  walletType: WalletType
  request: Request
  fromAddress: string
  account: AvmCapableAccount
  network: Network
  toAddress: string
  amount: bigint
}): Promise<string> => {
  const sentrySpanName = 'send-token'
  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.send' },
    async span => {
      try {
        const txRequest = await getTransactionRequest({
          walletId,
          walletType,
          toAddress,
          amount,
          network,
          fromAddress,
          sentrySpanName,
          accountIndex: account.index
        })

        const [txHash, txError] = await resolve(
          request({
            method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
            params: txRequest as AvalancheSendTransactionParams,
            chainId: getAvalancheCaip2ChainId(network.chainId)
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
  walletId,
  walletType,
  accountIndex,
  toAddress,
  fromAddress,
  amount,
  network,
  sentrySpanName
}: {
  walletId: string
  walletType: WalletType
  accountIndex: number
  amount: bigint
  toAddress: string
  fromAddress: string
  network: Network
  sentrySpanName?: SpanName
}): Promise<AvalancheSendTransactionParams> => {
  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.avm.get_trx_request' },
    async () => {
      const destinationAddress = 'X-' + stripChainAddress(toAddress ?? '')
      const unsignedTx = await WalletService.createSendXTx({
        walletId,
        walletType,
        accountIndex,
        amountInNAvax: amount,
        avaxXPNetwork: network,
        destinationAddress: destinationAddress,
        sourceAddress: fromAddress
      })

      const manager = utils.getManagerForVM(unsignedTx.getVM())
      const unsignedTxBytes = unsignedTx.toBytes()
      const [codec] = manager.getCodecFromBuffer(unsignedTxBytes)

      return {
        transactionHex: utils.bufferToHex(unsignedTxBytes),
        chainAlias: 'X' as Avalanche.ChainIDAlias,
        utxos: unsignedTx.utxos.map(utxo =>
          utils.bufferToHex(utxo.toBytes(codec))
        ),
        ...getInternalExternalAddrs({
          utxos: unsignedTx.utxos,
          xpAddressDict: { [fromAddress]: { space: 'e', index: 0 } },
          isTestnet: network.isTestnet === true
        })
      }
    }
  )
}
