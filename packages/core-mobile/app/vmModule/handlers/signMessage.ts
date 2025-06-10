import { Network } from '@avalabs/core-chains-sdk'
import {
  ApprovalResponse,
  RpcMethod,
  TypedData,
  MessageTypes,
  TypedDataV1
} from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'

export const signMessage = async ({
  method,
  data,
  account,
  network,
  resolve
}: {
  method: RpcMethod
  data: string | TypedData<MessageTypes> | TypedDataV1
  network: Network
  account: Account
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    const signedMessage = await WalletService.signMessage({
      rpcMethod: method,
      data,
      walletId: account.walletId,
      accountIndex: account.index,
      network
    })

    resolve({
      signedData: signedMessage
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: `Failed to sign ${network.vmName} message`,
        data: { cause: error }
      })
    })
  }
}
