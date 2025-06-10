import { Network } from '@avalabs/core-chains-sdk'
import {
  ApprovalResponse,
  BitcoinExecuteTxData
} from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { BtcTransactionRequest } from 'services/wallet/types'
import { BitcoinInputUTXO, createTransferTx } from '@avalabs/core-wallets-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

export const btcSendTransaction = async ({
  transactionData,
  network,
  account,
  finalFeeRate,
  resolve
}: {
  transactionData: BitcoinExecuteTxData
  network: Network
  account: Account
  finalFeeRate: number
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  const { to, amount, balance, feeRate, inputs, outputs } = transactionData

  try {
    let transaction: BtcTransactionRequest = { inputs, outputs }

    // we need to re-create the transaction when fee rate has changed
    if (finalFeeRate !== 0 && finalFeeRate !== feeRate) {
      const provider = await ModuleManager.bitcoinModule.getProvider(
        mapToVmNetwork(network)
      )
      const updatedTx = createTransferTx(
        to,
        account.addressBTC,
        amount,
        finalFeeRate,
        balance.utxos as BitcoinInputUTXO[],
        provider.getNetwork()
      )

      if (!updatedTx.inputs || !updatedTx.outputs) {
        throw new Error('Unable to create transaction')
      }

      transaction = { inputs: updatedTx.inputs, outputs: updatedTx.outputs }
    }

    const signedTx = await WalletService.sign({
      transaction,
      walletId: account.walletId,
      accountIndex: account.index,
      network
    })

    resolve({
      signedData: signedTx
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign btc transaction',
        data: { cause: error }
      })
    })
  }
}
