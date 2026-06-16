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
import { WalletType } from 'services/wallet/types'

const EVM_SIGN_METHODS = new Set([
  RpcMethod.ETH_SIGN,
  RpcMethod.PERSONAL_SIGN,
  RpcMethod.SIGN_TYPED_DATA,
  RpcMethod.SIGN_TYPED_DATA_V1,
  RpcMethod.SIGN_TYPED_DATA_V3,
  RpcMethod.SIGN_TYPED_DATA_V4
])

export const signMessage = async ({
  walletId,
  walletType,
  method,
  data,
  account,
  network,
  resolve
}: {
  walletId: string
  walletType: WalletType
  method: RpcMethod
  data: string | TypedData<MessageTypes> | TypedDataV1
  network: Network
  account: Account
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    const signedMessage = await WalletService.signMessage({
      walletId,
      walletType,
      rpcMethod: method,
      data,
      accountIndex: account.index,
      network,
      fromAddress: EVM_SIGN_METHODS.has(method) ? account.addressC : undefined
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
