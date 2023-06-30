import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'

export type ImportCParams = {
  activeAccount: Account
  isDevMode: boolean
}

export async function importC({
  activeAccount,
  isDevMode
}: ImportCParams): Promise<boolean> {
  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)

  const avaxProvider = NetworkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider

  const baseFee = await avaxProvider.getApiC().getBaseFee() //in WEI
  const baseFeeNAvax = baseFee / BigInt(1e9)
  const instantFee = baseFeeNAvax + (baseFeeNAvax * BigInt(20)) / BigInt(100) // Increase by 20% for instant speed

  const unsignedTx = await WalletService.createImportCTx(
    activeAccount.index,
    instantFee,
    avaxXPNetwork,
    'P',
    activeAccount.address
  )

  const signedTxJson = await WalletService.sign(
    {
      tx: unsignedTx,
      externalIndices: [],
      internalIndices: []
    } as AvalancheTransactionRequest,
    activeAccount.index,
    avaxXPNetwork
  )
  const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

  const txID = await NetworkService.sendTransaction(signedTx, avaxXPNetwork)
  Logger.trace('txID', txID)

  try {
    await exponentialBackoff(
      () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      result => result.status === 'Accepted',
      5
    )
  } catch (e) {
    Logger.error('exponentialBackoff failed', e)
    throw Error(`Transfer is taking unusually long (import P). txId = ${txID}`)
  }

  return true
}
