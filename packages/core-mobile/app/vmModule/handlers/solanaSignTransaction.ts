import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse } from '@avalabs/vm-module-types'
import { Account } from 'store/account/types'
import { rpcErrors } from '@metamask/rpc-errors'
import walletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'

// Payload accepted from ApprovalController
type SolanaTransactionPayload = {
  account: string
  message: string
}

export const solanaSignTransaction = async ({
  walletId,
  walletType,
  transactionData,
  account,
  network,
  resolve
}: {
  walletId: string
  walletType: WalletType
  transactionData: SolanaTransactionPayload
  account: Account
  network: Network
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    const signedTx = await walletService.sign({
      transaction: {
        account: transactionData.account,
        serializedTx: transactionData.message
      },
      accountIndex: account.index,
      network,
      walletId,
      walletType
    })

    // Return the signed transaction
    resolve({
      signedData: signedTx
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign Solana transaction',
        data: { cause: error }
      })
    })
  }
}
