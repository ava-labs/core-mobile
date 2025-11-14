import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { TransactionRequest } from 'ethers'
import { WalletType } from 'services/wallet/types'

export const ethSendTransaction = async ({
  transactionRequest,
  network,
  account,
  walletId,
  walletType,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasLimit,
  overrideData,
  resolve
}: {
  transactionRequest: TransactionRequest
  network: Network
  account: Account
  walletId: string
  walletType: WalletType
  maxFeePerGas: bigint | undefined
  maxPriorityFeePerGas: bigint | undefined
  gasLimit: number | undefined
  overrideData: string | undefined
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  const {
    gasLimit: defaultGasLimit,
    type,
    nonce,
    data,
    from,
    to,
    value
  } = transactionRequest

  const transaction = {
    nonce,
    type,
    chainId: network.chainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit: gasLimit ? BigInt(gasLimit) : defaultGasLimit,
    data: overrideData ?? data,
    from,
    to,
    value
  }

  try {
    const signedTx = await WalletService.sign({
      walletId,
      walletType,
      transaction,
      accountIndex: account.index,
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
