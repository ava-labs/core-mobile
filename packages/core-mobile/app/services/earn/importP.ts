import { retry, RetryBackoffPolicy } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { pvm, UnsignedTx } from '@avalabs/avalanchejs'
import { FundsStuckError } from 'hooks/earn/errors'
import { assertNotUndefined } from 'utils/assertions'
import { Network } from '@avalabs/core-chains-sdk'
import { getPChainBalance } from 'services/balance/getPChainBalance'
import {
  maxBalanceCheckRetries,
  maxTransactionCreationRetries,
  maxTransactionStatusCheckRetries
} from './utils'

export type ImportPParams = {
  walletId: string
  walletType: WalletType
  activeAccount: Account
  isDevMode: boolean
  selectedCurrency: string
  feeState?: pvm.FeeState
}

export async function importP({
  walletId,
  walletType,
  activeAccount,
  isDevMode,
  feeState
}: ImportPParams): Promise<void> {
  Logger.info('importing P started')

  const avaxPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)
  const unsignedTx = await WalletService.createImportPTx({
    walletId,
    walletType,
    accountIndex: activeAccount.index,
    avaxXPNetwork: avaxPNetwork,
    sourceChain: 'C',
    destinationAddress: activeAccount.addressPVM,
    feeState
  })

  const signedTxJson = await WalletService.sign({
    walletId,
    walletType,
    transaction: { tx: unsignedTx } as AvalancheTransactionRequest,
    accountIndex: activeAccount.index,
    network: avaxPNetwork
  })

  const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

  let txID: string
  try {
    txID = await retry({
      operation: () =>
        NetworkService.sendTransaction({ signedTx, network: avaxPNetwork }),
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

  const avaxProvider = await NetworkService.getAvalancheProviderXP(isDevMode)

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

const getUnlockedUnstakedAmount = async ({
  network,
  addressPVM,
  selectedCurrency
}: {
  network: Network
  addressPVM: string
  selectedCurrency: string
}): Promise<bigint | undefined> => {
  try {
    const pChainBalance = await getPChainBalance({
      pAddress: addressPVM,
      currency: selectedCurrency,
      avaxXPNetwork: network
    })

    return pChainBalance.balancePerType.unlockedUnstaked
  } catch (e) {
    return
  }
}

/**
 * Makes import P with check if P chain balance changed thus ensuring imported balance is immediately available.
 */
export async function importPWithBalanceCheck({
  walletId,
  walletType,
  activeAccount,
  isDevMode,
  selectedCurrency,
  feeState
}: ImportPParams): Promise<void> {
  //get P balance now then compare it later to check if balance changed after import
  const addressPVM = activeAccount.addressPVM
  assertNotUndefined(addressPVM)
  const network = NetworkService.getAvalancheNetworkP(isDevMode)

  const unlockedUnstakedBeforeImport = await getUnlockedUnstakedAmount({
    network,
    addressPVM,
    selectedCurrency
  })

  Logger.trace('balanceBeforeImport', unlockedUnstakedBeforeImport)

  await importP({
    walletId,
    walletType,
    activeAccount,
    isDevMode,
    selectedCurrency,
    feeState
  })

  await retry({
    operation: async () =>
      getUnlockedUnstakedAmount({
        network,
        addressPVM,
        selectedCurrency
      }),
    isSuccess: unlockedUnstakedAfterImport => {
      return unlockedUnstakedAfterImport !== unlockedUnstakedBeforeImport
    },
    maxRetries: maxBalanceCheckRetries,
    backoffPolicy: RetryBackoffPolicy.constant(1)
  })
}
