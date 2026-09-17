import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService, { isEvmSignMethod } from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import {
  MessageSigningRequest,
  UNSUPPORTED_WALLET_TYPE_ERROR,
  WalletType,
  isUnsupportedWalletTypeError
} from 'services/wallet/types'

export const signMessage = async ({
  walletId,
  walletType,
  signingData,
  account,
  network,
  resolve
}: {
  walletId: string
  walletType: WalletType
  signingData: MessageSigningRequest
  network: Network
  account: Account
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    const signedMessage = await WalletService.signMessage({
      walletId,
      walletType,
      signingData,
      accountIndex: account.index,
      network,
      fromAddress: isEvmSignMethod(signingData.type)
        ? account.addressC
        : undefined
    })

    resolve({
      signedData: signedMessage
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: isUnsupportedWalletTypeError(error)
          ? UNSUPPORTED_WALLET_TYPE_ERROR
          : `Failed to sign ${network.vmName} message`,
        data: { cause: error }
      })
    })
  }
}
