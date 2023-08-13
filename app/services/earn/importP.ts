import { Avalanche } from '@avalabs/wallets-sdk'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { EarnError } from 'hooks/earn/errors'
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

  let txID: string
  try {
    txID = await retry({
      operation: () => NetworkService.sendTransaction(signedTx, avaxXPNetwork),
      isSuccess: result => result !== '',
      maxRetries: maxTransactionStatusCheckRetries
    })
  } catch (e) {
    Logger.error('ISSUE_IMPORT_FAIL', e)
    throw new EarnError({
      name: 'ISSUE_IMPORT_FAIL',
      message: 'Sending import transaction failed ',
      cause: e
    })
  }

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
    throw new EarnError({
      name: 'CONFIRM_IMPORT_FAIL',
      message: 'Import did not finish',
      cause: e
    })
  }

  Logger.info('importing P finished')
  return true
}
