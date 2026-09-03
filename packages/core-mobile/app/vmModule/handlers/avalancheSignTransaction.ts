import { ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { avaxSerial, Credential, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'
import { Network } from '@avalabs/core-chains-sdk'
import {
  UNSUPPORTED_WALLET_TYPE_ERROR,
  WalletType,
  isUnsupportedWalletTypeError
} from 'services/wallet/types'
import { getInternalExternalAddrs } from 'common/hooks/send/utils/getInternalExternalAddrs'
import { getCachedXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'

export const avalancheSignTransaction = async ({
  unsignedTxJson,
  account,
  ownSignatureIndices,
  network,
  walletId,
  walletType,
  resolve
}: {
  unsignedTxJson: string
  network: Network
  account: Account
  ownSignatureIndices: [number, number][]
  walletId: string
  walletType: WalletType
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  if (!account) {
    throw new Error('Unable to submit transaction, no active account.')
  }

  try {
    const unsignedTx = UnsignedTx.fromJSON(unsignedTxJson)

    const { xpAddressDictionary } = await getCachedXPAddresses({
      walletId,
      walletType,
      account,
      isDeveloperMode: network.isTestnet ?? false
    })

    const signedTransactionJson = await WalletService.sign({
      walletId,
      walletType,
      transaction: {
        tx: unsignedTx,
        ...getInternalExternalAddrs({
          utxos: unsignedTx.utxos,
          xpAddressDict: xpAddressDictionary,
          isTestnet: network.isTestnet ?? false
        })
      },
      accountIndex: account.index,
      network
    })

    const signedTransaction = UnsignedTx.fromJSON(signedTransactionJson)
    const credentials = signedTransaction.getCredentials()

    const details = unsignedTx.getSigIndices().reduce<{
      credentials: Credential[]
      ownSignatures: { signature: string; sigIndices: [number, number] }[]
    }>(
      (correctedDetails, signatureIndices, inputIndex) => {
        const signatures = signatureIndices.map(sigIndex => {
          const signature = credentials[inputIndex]?.toJSON()[sigIndex]
          const isOwnSignature = ownSignatureIndices.some(
            ownIndices =>
              JSON.stringify(ownIndices) ===
              JSON.stringify([inputIndex, sigIndex])
          )

          if (
            !signature ||
            (isOwnSignature &&
              signature.toString() ===
                utils.bufferToHex(Avalanche.emptySignature.toBytes()))
          ) {
            throw new Error(`Failed to sign [${inputIndex}, ${sigIndex}]`)
          }

          if (isOwnSignature) {
            correctedDetails.ownSignatures.push({
              signature: signature.toString(),
              sigIndices: [inputIndex, sigIndex]
            })
          }

          return signature
        })

        correctedDetails.credentials.push(new Credential(signatures))

        return correctedDetails
      },
      {
        credentials: [],
        ownSignatures: []
      }
    )

    // create a new SignedTx with the corrected credentials
    const correctedSignexTx = new avaxSerial.SignedTx(
      signedTransaction.getTx(),
      details.credentials
    )

    resolve({
      signedData: JSON.stringify({
        signedTransactionHex: Avalanche.signedTxToHex(correctedSignexTx),
        signatures: details.ownSignatures
      })
    })
  } catch (error) {
    if (isUnsupportedWalletTypeError(error)) {
      Logger.warn(
        '[avalancheSignTransaction] sign rejected',
        UNSUPPORTED_WALLET_TYPE_ERROR
      )
      resolve({
        error: rpcErrors.internal({
          message: UNSUPPORTED_WALLET_TYPE_ERROR,
          data: { cause: error }
        })
      })
      return
    }

    Logger.error('Failed to sign avalanche transaction', JSON.stringify(error))
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign avalanche transaction',
        data: { cause: error }
      })
    })
  }
}
