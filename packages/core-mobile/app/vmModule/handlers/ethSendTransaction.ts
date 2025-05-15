import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { TransactionRequest } from 'ethers'
import { getAccountIndex } from 'store/account/utils'
export const ethSendTransaction = async ({
  transactionRequest,
  network,
  account,
  maxFeePerGas,
  maxPriorityFeePerGas,
  overrideData,
  resolve
}: {
  transactionRequest: TransactionRequest
  network: Network
  account: Account
  maxFeePerGas: bigint | undefined
  maxPriorityFeePerGas: bigint | undefined
  overrideData: string | undefined
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  const { gasLimit, type, nonce, data, from, to, value } = transactionRequest

  const transaction = {
    nonce,
    type,
    chainId: network.chainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    data: overrideData ?? data,
    from,
    to,
    value
  }

  try {
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
        message: 'Failed to sign evm transaction',
        data: { cause: error }
      })
    })
  }
}
