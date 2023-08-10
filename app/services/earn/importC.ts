import { Avalanche } from '@avalabs/wallets-sdk'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { Avax } from 'types/Avax'
import { maxTransactionStatusCheckRetries } from './utils'

export type ImportCParams = {
  activeAccount: Account
  isDevMode: boolean
}

export async function importC({
  activeAccount,
  isDevMode
}: ImportCParams): Promise<boolean> {
  Logger.info('importing C started')

  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)

  const avaxProvider = NetworkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider

  const baseFee = await avaxProvider.getApiC().getBaseFee() //in WEI
  const baseFeeAvax = Avax.fromWei(baseFee)
  const instantBaseFee = WalletService.getInstantBaseFee(baseFeeAvax)

  const unsignedTx = await WalletService.createImportCTx({
    accountIndex: activeAccount.index,
    baseFee: instantBaseFee,
    avaxXPNetwork,
    sourceChain: 'P',
    destinationAddress: activeAccount.address
  })

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
    await retry({
      operation: () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      isSuccess: result => result.status === 'Accepted',
      maxRetries: maxTransactionStatusCheckRetries
    })
  } catch (e) {
    Logger.error('importC failed', e)
    throw Error(`Import C failed. txId = ${txID}. ${e}`)
  }

  Logger.info('importing C ended')
  return true
}
