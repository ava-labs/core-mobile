import { Network } from '@avalabs/core-chains-sdk'
import { CorePrimaryAccount } from '@avalabs/types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { resolve } from '@avalabs/core-utils-sdk'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getAvalancheCaip2ChainId } from 'temp/caip2ChainIds'
import { AvalancheSendTransactionParams } from '@avalabs/avalanche-module'
import { stripChainAddress } from 'store/account/utils'
import WalletService from 'services/wallet/WalletService'
import { utils } from '@avalabs/avalanchejs'
import { Transaction } from '@sentry/react'
import { getInternalExternalAddrs } from '../getInternalExternalAddrs'

export const send = async ({
  request,
  fromAddress,
  account,
  network,
  toAddress,
  amount
}: {
  request: Request
  fromAddress: string
  account: CorePrimaryAccount
  network: Network
  toAddress: string
  amount: bigint
}): Promise<string> => {
  const sentryTrx = SentryWrapper.startTransaction('send-token')

  return SentryWrapper.createSpanFor(sentryTrx)
    .setContext('svc.send.send')
    .executeAsync(async () => {
      const txRequest = await getTransactionRequest({
        toAddress,
        amount,
        network,
        fromAddress,
        sentryTrx,
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
    })
    .finally(() => {
      SentryWrapper.finish(sentryTrx)
    })
}

const getTransactionRequest = ({
  accountIndex,
  toAddress,
  fromAddress,
  amount,
  network,
  sentryTrx
}: {
  accountIndex: number
  amount: bigint
  toAddress: string
  fromAddress: string
  network: Network
  sentryTrx: Transaction
}): Promise<AvalancheSendTransactionParams> => {
  return SentryWrapper.createSpanFor(sentryTrx)
    .setContext('svc.send.avm.get_trx_request')
    .executeAsync(async () => {
      const destinationAddress = 'X-' + stripChainAddress(toAddress ?? '')
      const unsignedTx = await WalletService.createSendXTx({
        accountIndex,
        amount,
        avaxXPNetwork: network,
        destinationAddress: destinationAddress,
        sourceAddress: fromAddress
      })

      const manager = utils.getManagerForVM(unsignedTx.getVM())
      const unsignedTxBytes = unsignedTx.toBytes()
      const [codec] = manager.getCodecFromBuffer(unsignedTxBytes)

      return {
        transactionHex: utils.bufferToHex(unsignedTxBytes),
        chainAlias: 'X',
        utxos: unsignedTx.utxos.map(utxo =>
          utils.bufferToHex(utxo.toBytes(codec))
        ),
        ...getInternalExternalAddrs(
          unsignedTx.utxos,
          { [fromAddress]: { space: 'e', index: 0 } },
          network.isTestnet === true
        )
      }
    })
}
