import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'

export type ImportPParams = {
  activeAccount: Account
  isDevMode: boolean
}

export async function importP({
  activeAccount,
  isDevMode
}: ImportPParams): Promise<boolean> {
  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)

  const unsignedTx = await WalletService.createImportPTx(
    activeAccount.index,
    avaxXPNetwork,
    'C',
    activeAccount.addressPVM
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
      5
    )
  } catch (e) {
    Logger.error('exponentialBackoff failed', e)
    throw Error(`Transfer is taking unusually long (import P). txId = ${txID}`)
  }

  return true
}
