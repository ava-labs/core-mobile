import { Network } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { resolve } from '@avalabs/core-utils-sdk'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { getAvalancheCaip2ChainId } from 'utils/caip2ChainIds'
import { AvalancheSendTransactionParams } from '@avalabs/avalanche-module'
import { stripChainAddress } from 'store/account/utils'
import { UnsignedTx, utils } from '@avalabs/avalanchejs'
import { SpanName } from 'services/sentry/types'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { SPAN_STATUS_ERROR } from '@sentry/core'
import { RpcMethod } from '@avalabs/vm-module-types'
import { AvmCapableAccount } from 'common/hooks/send/utils/types'
import { XPAddressDictionary } from 'store/account'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { getInternalExternalAddrs } from '../getInternalExternalAddrs'

export const send = async ({
  request,
  fromAddress,
  account,
  network,
  toAddress,
  amount,
  xpAddresses,
  xpAddressDictionary
}: {
  request: Request
  fromAddress: string
  account: AvmCapableAccount
  network: Network
  toAddress: string
  amount: bigint
  xpAddresses: string[]
  xpAddressDictionary: XPAddressDictionary
}): Promise<string> => {
  const sentrySpanName = 'send-token'
  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.send' },
    async span => {
      try {
        const isTestnet = Boolean(network.isTestnet)
        const destinationAddress = 'X-' + stripChainAddress(toAddress ?? '')
        const unsignedTx = await AvalancheWalletService.createSendXTx({
          account,
          amountInNAvax: amount,
          isTestnet,
          destinationAddress: destinationAddress,
          sourceAddress: fromAddress,
          xpAddresses
        })

        const txRequest = await getTransactionRequest({
          unsignedTx,
          isTestnet,
          sentrySpanName,
          xpAddressDictionary
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
  unsignedTx,
  isTestnet,
  sentrySpanName,
  xpAddressDictionary
}: {
  unsignedTx: UnsignedTx
  isTestnet: boolean
  sentrySpanName?: SpanName
  xpAddressDictionary: XPAddressDictionary
}): Promise<AvalancheSendTransactionParams> => {
  return SentryWrapper.startSpan(
    { name: sentrySpanName, contextName: 'svc.send.avm.get_trx_request' },
    async () => {
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
          xpAddressDict: xpAddressDictionary,
          isTestnet
        })
      }
    }
  )
}
