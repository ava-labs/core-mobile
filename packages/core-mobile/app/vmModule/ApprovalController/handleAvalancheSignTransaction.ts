import { ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { avaxSerial, Credential, UnsignedTx, utils } from '@avalabs/avalanchejs'
import NetworkService from 'services/network/NetworkService'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'

export const handleAvalancheSignTransaction = async ({
  unsignedTxJson,
  account,
  isTestnet,
  ownSignatureIndices,
  resolve
}: {
  unsignedTxJson: string
  account: Account
  ownSignatureIndices: [number, number][]
  isTestnet?: boolean
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
      accountIndex: account.index,
      network: NetworkService.getAvalancheNetworkP(isTestnet ?? false)
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
      result: `0x${JSON.stringify({
        signedTransactionHex: Avalanche.signedTxToHex(correctedSignexTx),
        signatures: details.ownSignatures
      })}`
    })
  } catch (error) {
    Logger.error(
      'Unable to approve sign transaction request',
      JSON.stringify(error)
    )

    const message =
      'message' in (error as Error)
        ? (error as Error).message
        : 'Sign transaction error'
    resolve({
      error: rpcErrors.internal(message)
    })
  }
}
