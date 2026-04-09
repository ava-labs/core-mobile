import { Network } from '@avalabs/core-chains-sdk'
import {
  ApprovalResponse,
  BitcoinExecuteTxData
} from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { BtcTransactionRequest, WalletType } from 'services/wallet/types'
import { BitcoinInputUTXO, createTransferTx } from '@avalabs/core-wallets-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

export const btcSendTransaction = async ({
  transactionData,
  network,
  account,
  finalFeeRate,
  walletId,
  walletType,
  resolve
}: {
  transactionData: BitcoinExecuteTxData
  network: Network
  account: Account
  finalFeeRate: number
  walletId: string
  walletType: WalletType
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  const { to, amount, balance, feeRate, inputs, outputs } = transactionData

  try {
    let transaction: BtcTransactionRequest = { inputs, outputs }

    // Re-create the transaction when fee rate has changed.
    // Fetch fresh UTXOs from the network instead of using the stale snapshot
    // from when the approval dialog was first shown — UTXOs can become spent
    // between then and now, causing coinselect to fail.
    if (finalFeeRate !== 0 && finalFeeRate !== feeRate) {
      const provider = await ModuleManager.bitcoinModule.getProvider(
        mapToVmNetwork(network)
      )
      const freshBalance = await provider.getUtxoBalance(
        account.addressBTC,
        true
      )
      const updatedTx = createTransferTx(
        to,
        account.addressBTC,
        amount,
        finalFeeRate,
        (freshBalance?.utxos ?? balance.utxos) as BitcoinInputUTXO[],
        provider.getNetwork()
      )

      if (!updatedTx.inputs || !updatedTx.outputs) {
        throw new Error(
          `Unable to create transaction: insufficient funds for fee (${updatedTx.fee} sats required)`
        )
      }

      transaction = { inputs: updatedTx.inputs, outputs: updatedTx.outputs }
    }

    const signedTx = await WalletService.sign({
      walletId,
      walletType,
      transaction,
      accountIndex: account.index,
      accountName: account.name,
      network
    })

    resolve({
      signedData: signedTx
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to sign btc transaction'
    resolve({
      error: rpcErrors.internal({
        message,
        data: { cause: error }
      })
    })
  }
}
