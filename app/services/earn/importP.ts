import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'

export type ImportPParams = {
  walletService: typeof WalletService
  networkService: typeof NetworkService
  activeAccount: Account
  isDevMode: boolean
}

export async function importP({
  walletService,
  networkService,
  activeAccount,
  isDevMode
}: ImportPParams): Promise<boolean> {
  const avaxXPNetwork = networkService.getAvalancheNetworkXP(isDevMode)

  const unsignedTx = await walletService.createImportPTx(
    activeAccount.index,
    avaxXPNetwork,
    'C',
    activeAccount.addressPVM
  )

  const signedTxJson = await walletService.sign(
    { tx: unsignedTx } as AvalancheTransactionRequest,
    activeAccount.index,
    avaxXPNetwork
  )
  const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

  const txID = await networkService.sendTransaction(signedTx, avaxXPNetwork)
  Logger.trace('txID', txID)

  const avaxProvider = networkService.getProviderForNetwork(
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
    return false
  }

  return true
}
