import { Network } from '@avalabs/core-chains-sdk'
import {
  Hex,
  ApprovalResponse,
  RpcMethod,
  TypedData,
  MessageTypes,
  TypedDataV1
} from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'

export const handleEthSign = async ({
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
      accountIndex: account.index,
      network
    })

    resolve({
      result: signedMessage as Hex
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal('failed to sign evm message')
    })
  }
}
