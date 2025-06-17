import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse } from '@avalabs/vm-module-types'
import { Account } from 'store/account/types'
import { rpcErrors } from '@metamask/rpc-errors'
import walletService from 'services/wallet/WalletService'

export const solanaSendTransaction = async ({
  transactionData,
  network,
  account,
  resolve
}: {
  transactionData: string
  network: Network
  account: Account
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    // Sign the transaction - following core-mobile pattern
    const signedTx = await walletService.sign({
      transaction: {
        serializedTx: transactionData
      },
      accountIndex: account.index,
      network
    })

    // Return the signed transaction data (not the hash)
    // The ApprovalController/VM module will handle broadcasting
    resolve({
      signedData: signedTx
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign solana transaction',
        data: { cause: error }
      })
    })
  }
}
