import { Avalanche } from '@avalabs/wallets-sdk'
import { retry, RetryBackoffPolicy } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { FundsStuckError } from 'hooks/earn/errors'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { assertNotUndefined } from 'utils/assertions'
import {
  maxBalanceCheckRetries,
  maxTransactionCreationRetries,
  maxTransactionStatusCheckRetries
} from './utils'

export type ImportPParams = {
  activeAccount: Account
  isDevMode: boolean
}

export async function importP({
  activeAccount,
  isDevMode
}: ImportPParams): Promise<void> {
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
      maxRetries: maxTransactionCreationRetries
    })
  } catch (e) {
    Logger.error('ISSUE_IMPORT_FAIL', e)
    throw new FundsStuckError({
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
    throw new FundsStuckError({
      name: 'CONFIRM_IMPORT_FAIL',
      message: 'Import did not finish',
      cause: e
    })
  }

  Logger.info('importing P finished')
}

/**
 * Makes import P with check if P chain balance changed thus ensuring imported balance is immediately available.
 */
export async function importPWithBalanceCheck({
  activeAccount,
  isDevMode
}: ImportPParams): Promise<void> {
  //get P balance now then compare it later to check if balance changed after import
  const addressPVM = activeAccount.addressPVM
  assertNotUndefined(addressPVM)

  const balanceBeforeImport = (
    await GlacierBalanceService.getPChainBalance(isDevMode, [addressPVM])
  ).unlockedUnstaked[0]?.amount

  Logger.trace('balanceBeforeImport', balanceBeforeImport)

  await importP({
    activeAccount,
    isDevMode
  })

  await retry({
    operation: async () =>
      GlacierBalanceService.getPChainBalance(isDevMode, [addressPVM]),
    isSuccess: pChainBalance => {
      const balanceAfterImport = pChainBalance.unlockedUnstaked[0]?.amount
      return balanceAfterImport !== balanceBeforeImport
    },
    maxRetries: maxBalanceCheckRetries,
    backoffPolicy: RetryBackoffPolicy.constant(1)
  })
}
