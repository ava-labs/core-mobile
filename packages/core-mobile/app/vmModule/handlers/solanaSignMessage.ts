import { Buffer } from 'buffer'
import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse, RpcMethod } from '@avalabs/vm-module-types'
import { Account } from 'store/account/types'
import { rpcErrors } from '@metamask/rpc-errors'
import walletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { base58 } from '@scure/base'

// Payload accepted from ApprovalController
type SolanaMessagePayload = {
  pubkey: string
  message: string
}

export const solanaSignMessage = async ({
  walletId,
  walletType,
  message,
  account,
  network,
  resolve
}: {
  walletId: string
  walletType: WalletType
  message: SolanaMessagePayload
  account: Account
  network: Network
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    const signatureBase64 = await walletService.signMessage({
      walletId,
      walletType,
      rpcMethod: RpcMethod.SOLANA_SIGN_MESSAGE,
      data: message.message,
      accountIndex: account.index,
      network
    })

    // Convert base64 signature to base58 for WalletConnect spec compliance
    const signatureBuffer = Buffer.from(signatureBase64, 'base64')

    if (signatureBuffer.length !== 64) {
      throw new Error(
        `Invalid signature length: ${signatureBuffer.length} bytes. Expected 64 bytes.`
      )
    }

    const signatureBase58 = base58.encode(Uint8Array.from(signatureBuffer))

    resolve({
      signedData: signatureBase58
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign Solana message',
        data: { cause: error }
      })
    })
  }
}
