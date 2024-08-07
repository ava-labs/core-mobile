import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import walletService from 'services/wallet/WalletService'
import networkService from 'services/network/NetworkService'
import { ApprovalResponse, Hex, RpcRequest } from '@avalabs/vm-module-types'
import { EVM, EVMUnsignedTx, UnsignedTx } from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import {
  showTransactionErrorToast,
  showTransactionSuccessToast
} from 'utils/toast'

export const handleAvalancheSendTransaction = async ({
  request,
  unsignedTxJson,
  vm,
  account,
  isTestnet,
  resolve
}: {
  request: RpcRequest
  unsignedTxJson: string
  vm: 'EVM' | 'AVM' | 'PVM'
  account: Account
  isTestnet?: boolean
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  try {
    // @ts-ignore
    const externalIndices = request.params?.externalIndices ?? []
    // @ts-ignore
    const internalIndices = request.params?.internalIndices ?? []

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
      network: networkService.getAvalancheNetworkP(isTestnet ?? false),
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

    // Submit the transaction and return the tx id
    const provider = networkService.getAvalancheProviderXP(isTestnet ?? false)
    const { txID } = await provider.issueTxHex(signedTransactionHex, vm)

    showTransactionSuccessToast({
      message: 'Transaction Successful',
      txHash: txID
    })

    resolve({
      result: txID as Hex
    })
  } catch (e) {
    showTransactionErrorToast({ message: 'Transaction Failed' })
    resolve({
      error: rpcErrors.internal('failed to sign avalanche transaction')
    })
  }
}
