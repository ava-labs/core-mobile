import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { pvm, UnsignedTx } from '@avalabs/avalanchejs'
import NetworkService from 'services/network/NetworkService'
import { FundsStuckError } from 'hooks/earn/errors'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { maxTransactionStatusCheckRetries } from './utils'

export type ExportPParams = {
  walletId: string
  walletType: WalletType
  pChainBalance: TokenUnit
  requiredAmount: TokenUnit
  activeAccount: Account
  isDevMode: boolean
  feeState?: pvm.FeeState
}

export async function exportP({
  walletId,
  walletType,
  pChainBalance,
  requiredAmount,
  activeAccount,
  isDevMode,
  feeState
}: ExportPParams): Promise<void> {
  Logger.info('exporting P started')

  if (pChainBalance.lt(requiredAmount)) {
    throw Error('Not enough balance on P chain')
  }
  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)

  const unsignedTx = await WalletService.createExportPTx({
    walletId,
    walletType,
    amountInNAvax: requiredAmount.toSubUnit(),
    accountIndex: activeAccount.index,
    avaxXPNetwork,
    destinationChain: 'C',
    destinationAddress: activeAccount.addressCoreEth,
    feeState
  })

  const signedTxJson = await WalletService.sign({
    walletId,
    walletType,
    transaction: { tx: unsignedTx } as AvalancheTransactionRequest,
    accountIndex: activeAccount.index,
    network: avaxXPNetwork
  })
  const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

  const txID = await NetworkService.sendTransaction({
    signedTx,
    network: avaxXPNetwork
  })
  Logger.trace('txID', txID)

  const avaxProvider = await NetworkService.getAvalancheProviderXP(isDevMode)

  try {
    await retry({
      operation: () => avaxProvider.getApiP().getTxStatus({ txID }),
      shouldStop: result => result.status === 'Committed',
      maxRetries: maxTransactionStatusCheckRetries
    })
  } catch (e) {
    Logger.error('exportP failed', e)
    throw new FundsStuckError({
      name: 'CONFIRM_EXPORT_FAIL',
      message: 'Export did not finish',
      cause: e
    })
  }

  Logger.info('exporting P ended')
}
