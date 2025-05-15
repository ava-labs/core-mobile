import { ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { avaxSerial, Credential, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'
import { Network } from '@avalabs/core-chains-sdk'
import { getAccountIndex } from 'store/account/utils'

export const avalancheSignTransaction = async ({
  unsignedTxJson,
  account,
  ownSignatureIndices,
  network,
  resolve
}: {
  unsignedTxJson: string
  network: Network
  account: Account
  ownSignatureIndices: [number, number][]
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  if (!account) {
    throw new Error('Unable to submit transaction, no active account.')
  }

  try {
    const unsignedTx = UnsignedTx.fromJSON(unsignedTxJson)
    const signedTransactionJson = await WalletService.sign({
      transaction: {
        tx: unsignedTx
      },
      accountIndex: getAccountIndex(account),
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
    Logger.error('Failed to sign avalanche transaction', JSON.stringify(error))
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign avalanche transaction',
        data: { cause: error }
      })
    })
  }
}
