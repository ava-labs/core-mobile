import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import { ImportPParams } from 'services/wallet/types'

export async function importP({
  walletService,
  networkService,
  activeAccount,
  isDevMode
}: ImportPParams): Promise<boolean> {
  const avaxXPNetwork = networkService.getAvalancheNetworkXP(isDevMode)
  const wallet = (await walletService.getWallet(
    activeAccount.index,
    avaxXPNetwork
  )) as Avalanche.StaticSigner
  const utxoSet = await wallet.getAtomicUTXOs('P', 'C')
  const unsignedTx = wallet.importP(utxoSet, 'C', activeAccount.addressPVM)
  const signedTx = (
    await wallet.signTx({
      tx: unsignedTx
    })
  ).getSignedTx()

  const txID = await networkService.sendTransaction(
    signedTx,
    avaxXPNetwork,
    true
  )
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
