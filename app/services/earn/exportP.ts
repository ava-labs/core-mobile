import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import NetworkService from 'services/network/NetworkService'
import { Avax } from 'types/Avax'
import { maxTransactionStatusCheckRetries } from './utils'

export type ExportPParams = {
  pChainBalance: Avax
  requiredAmount: Avax
  activeAccount: Account
  isDevMode: boolean
}

export async function exportP({
  pChainBalance,
  requiredAmount,
  activeAccount,
  isDevMode
}: ExportPParams): Promise<boolean> {
  Logger.info('exporting P started')

  if (pChainBalance.lt(requiredAmount)) {
    throw Error('Not enough balance on P chain')
  }
  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)

  const unsignedTx = await WalletService.createExportPTx(
    requiredAmount.toSubUnit(),
    activeAccount.index,
    avaxXPNetwork,
    'C',
    activeAccount.addressCoreEth
  )

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
    await exponentialBackoff(
      () => avaxProvider.getApiP().getTxStatus({ txID }),
      result => result.status === 'Committed',
      maxTransactionStatusCheckRetries
    )
  } catch (e) {
    Logger.error('exponentialBackoff failed', e)
    throw Error(`Transfer is taking unusually long (export P). txId = ${txID}`)
  }

  Logger.info('exporting P ended')
  return true
}
