import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse } from '@avalabs/vm-module-types'
import { Account } from 'store/account/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { getSVMProvider } from 'services/network/utils/providerUtils'
import { compileSolanaTx, serializeSolanaTx } from '@avalabs/core-wallets-sdk'

export const solanaSendTransaction = async ({
  transactionData,
  network,
  account,
  resolve
}: {
  transactionData: {
    params: {
      request: {
        params: [{
          account: string
          serializedTx: string
        }]
      }
    }
  }
  network: Network
  account: Account
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  console.log('transactionData', transactionData)
  try {
    const provider = await getSVMProvider(network)
    const tx = compileSolanaTx(transactionData)
    const base64Tx = serializeSolanaTx(tx)
    const pendingTx = await provider.sendTransaction(base64Tx, {
      skipPreflight: false
    })

    const signature = await pendingTx

    resolve({
      signedData: signature.toString()
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to send solana transaction',
        data: { cause: error }
      })
    })
  }
}
