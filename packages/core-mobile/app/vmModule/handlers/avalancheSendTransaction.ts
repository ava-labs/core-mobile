import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import walletService from 'services/wallet/WalletService'
import networkService from 'services/network/NetworkService'
import { ApprovalResponse, Hex, Network } from '@avalabs/vm-module-types'
import { EVM, EVMUnsignedTx, UnsignedTx } from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'

export const avalancheSendTransaction = async ({
  unsignedTxJson,
  vm,
  externalIndices,
  internalIndices,
  account,
  network,
  resolve
}: {
  unsignedTxJson: string
  vm: 'EVM' | 'AVM' | 'PVM'
  externalIndices: number[]
  internalIndices: number[]
  account: Account
  network: Network
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    // Parse the json into a tx object
    const unsignedTx =
      vm === EVM
        ? EVMUnsignedTx.fromJSON(unsignedTxJson)
        : UnsignedTx.fromJSON(unsignedTxJson)

    const hasMultipleAddresses =
      unsignedTx.addressMaps.getAddresses().length > 1

    if (
      hasMultipleAddresses &&
      !externalIndices.length &&
      !internalIndices.length
    ) {
      throw new Error(
        'Transaction contains multiple addresses, but indices were not provided'
      )
    }

    const signedTransactionJson = await walletService.sign({
      // Must tell it is avalanche network
      // in the sign function of wallets, network is only used to get the provider
      // so we can pass p network to get the provider, no matter what the network is
      // we might need to change this in the future
      network: networkService.getAvalancheNetworkP(network.isTestnet ?? false),
      transaction: {
        tx: unsignedTx,
        externalIndices,
        internalIndices
      },
      accountIndex: account.index
    })

    const signedTransaction =
      vm === EVM
        ? EVMUnsignedTx.fromJSON(signedTransactionJson)
        : UnsignedTx.fromJSON(signedTransactionJson)

    if (!signedTransaction.hasAllSignatures()) {
      throw new Error('Signing error, missing signatures.')
    }

    const signedTransactionHex = Avalanche.signedTxToHex(
      signedTransaction.getSignedTx()
    )

    resolve({
      signedData: signedTransactionHex as Hex
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign avalanche transaction',
        data: { cause: error }
      })
    })
  }
}
