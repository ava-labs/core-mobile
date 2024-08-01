import { Network } from '@avalabs/core-chains-sdk'
import { Hex, ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { TransactionRequest } from 'ethers'

export const handleEthSendTransaction = async ({
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
      accountIndex: account.index,
      network
    })

    resolve({
      result: signedTx as Hex
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal('failed to sign evm transaction')
    })
  }
}
