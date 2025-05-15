import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse, BitcoingSignTxData } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { BtcTransactionRequest } from 'services/wallet/types'
import { getAccountIndex } from 'store/account/utils'

export const btcSignTransaction = async ({
  transactionData,
  network,
  account,
  resolve
}: {
  transactionData: BitcoingSignTxData
  network: Network
  account: Account
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  const { inputs, outputs } = transactionData

  try {
    const transaction: BtcTransactionRequest = { inputs, outputs }

    const signedTx = await WalletService.sign({
      transaction,
      accountIndex: getAccountIndex(account),
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
