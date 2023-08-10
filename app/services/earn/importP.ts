import { Avalanche } from '@avalabs/wallets-sdk'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { maxTransactionStatusCheckRetries } from './utils'

export type ImportPParams = {
  activeAccount: Account
  isDevMode: boolean
}

export async function importP({
  activeAccount,
  isDevMode
}: ImportPParams): Promise<boolean> {
  Logger.info('importing P started')

  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)

  const unsignedTx = await WalletService.createImportPTx({
    accountIndex: activeAccount.index,
    avaxXPNetwork,
    sourceChain: 'C',
    destinationAddress: activeAccount.addressPVM
  })

  const signedTxJson = await WalletService.sign(
    { tx: unsignedTx } as AvalancheTransactionRequest,
    activeAccount.index,
    avaxXPNetwork
  )
  const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

  const txID = await NetworkService.sendTransaction(signedTx, avaxXPNetwork)
  Logger.trace('txID', txID)

  const avaxProvider = NetworkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider
  try {
    await retry({
      operation: () => avaxProvider.getApiP().getTxStatus({ txID }),
      isSuccess: result => result.status === 'Committed',
      maxRetries: maxTransactionStatusCheckRetries
    })
  } catch (e) {
    Logger.error('importP failed', e)
    throw Error(`Import P failed. txId = ${txID}. ${e}`)
  }

  Logger.info('importing P ended')
  return true
}
