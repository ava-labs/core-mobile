import { Avalanche } from '@avalabs/core-wallets-sdk'
import { retry, RetryBackoffPolicy } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs'
import { FundsStuckError } from 'hooks/earn/errors'
import { assertNotUndefined } from 'utils/assertions'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { Network } from '@avalabs/chains-sdk'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import {
  maxBalanceCheckRetries,
  maxTransactionCreationRetries,
  maxTransactionStatusCheckRetries
} from './utils'

export type ImportPParams = {
  activeAccount: Account
  isDevMode: boolean
  selectedCurrency: string
}

export async function importP({
  activeAccount,
  isDevMode
}: ImportPParams): Promise<void> {
  Logger.info('importing P started')

  const avaxPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)

  const unsignedTx = await WalletService.createImportPTx({
    accountIndex: activeAccount.index,
    avaxXPNetwork: avaxPNetwork,
    sourceChain: 'C',
    destinationAddress: activeAccount.addressPVM
  })

  const signedTxJson = await WalletService.sign({
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

  const avaxProvider = NetworkService.getProviderForNetwork(
    avaxPNetwork
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

const getUnlockedUnstakedAmount = async ({
  network,
  addressPVM,
  selectedCurrency
}: {
  network: Network
  addressPVM: string
  selectedCurrency: string
}): Promise<number | undefined> => {
  const balancesResponse = await ModuleManager.avalancheModule.getBalances({
    addresses: [addressPVM],
    currency: selectedCurrency,
    network: mapToVmNetwork(network),
    storage: coingeckoInMemoryCache
  })
  const pChainBalance =
    balancesResponse[addressPVM]?.[network.networkToken.symbol]
  if (pChainBalance === undefined || !isTokenWithBalancePVM(pChainBalance)) {
    return
  }
  return pChainBalance.balancePerType.unlockedUnstaked
}

/**
 * Makes import P with check if P chain balance changed thus ensuring imported balance is immediately available.
 */
export async function importPWithBalanceCheck({
  activeAccount,
  isDevMode,
  selectedCurrency
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
    activeAccount,
    isDevMode,
    selectedCurrency
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
