import { resolve } from '@avalabs/core-utils-sdk'
import { RpcMethod } from '@avalabs/vm-module-types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { getAvalancheCaip2ChainId } from 'utils/caip2ChainIds'
import { AvalancheSendTransactionParams } from '@avalabs/avalanche-module'
import { pvm, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { Transaction } from '@sentry/react'
import { Network } from '@avalabs/core-chains-sdk'
import WalletService from 'services/wallet/WalletService'
import { stripChainAddress } from 'store/account/utils'
import { getInternalExternalAddrs } from '../getInternalExternalAddrs'

export const send = async ({
  request,
  network,
  fromAddress,
  toAddress,
  amountInNAvax,
  feeState,
  accountIndex
}: {
  request: Request
  network: Network
  fromAddress: string
  toAddress: string
  amountInNAvax: bigint
  feeState?: pvm.FeeState
  accountIndex: number
}): Promise<string> => {
  const sentryTrx = SentryWrapper.startTransaction('send-token')

  return SentryWrapper.createSpanFor(sentryTrx)
    .setContext('svc.send.send')
    .executeAsync(async () => {
      const destinationAddress = 'P-' + stripChainAddress(toAddress ?? '')
      const unsignedTx = await WalletService.createSendPTx({
        accountIndex: accountIndex,
        amountInNAvax,
        avaxXPNetwork: network,
        destinationAddress: destinationAddress,
        sourceAddress: fromAddress,
        feeState
      })

      const txRequest = await getTransactionRequest({
        unsignedTx,
        fromAddress,
        network,
        sentryTrx
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
    })
    .finally(() => {
      SentryWrapper.finish(sentryTrx)
    })
}

const getTransactionRequest = ({
  unsignedTx,
  fromAddress,
  network,
  sentryTrx
}: {
  unsignedTx: UnsignedTx
  fromAddress: string
  network: Network
  sentryTrx: Transaction
}): Promise<AvalancheSendTransactionParams> => {
  return SentryWrapper.createSpanFor(sentryTrx)
    .setContext('svc.send.pvm.get_trx_request')
    .executeAsync(async () => {
      const manager = utils.getManagerForVM(unsignedTx.getVM())
      const unsignedTxBytes = unsignedTx.toBytes()
      const [codec] = manager.getCodecFromBuffer(unsignedTxBytes)

      return {
        transactionHex: utils.bufferToHex(unsignedTxBytes),
        chainAlias: 'P',
        utxos: unsignedTx.utxos.map(utxo =>
          utils.bufferToHex(utxo.toBytes(codec))
        ),
        ...getInternalExternalAddrs({
          utxos: unsignedTx.utxos,
          xpAddressDict: { [fromAddress]: { space: 'e', index: 0 } },
          isTestnet: network.isTestnet === true
        })
      }
    })
}
