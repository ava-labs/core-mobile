import { ChainId } from '@avalabs/chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import { calculatePChainFee } from 'services/earn/calculateCrossChainFees'
import BN from 'bn.js'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'

export type ExportCParams = {
  /**
   * in nAvax
   */
  requiredAmount: BN
  walletService: typeof WalletService
  networkService: typeof NetworkService
  activeAccount: Account
  isDevMode: boolean
}

export async function exportC({
  requiredAmount,
  walletService,
  networkService,
  activeAccount,
  isDevMode
}: ExportCParams): Promise<boolean> {
  const avaxXPNetwork = networkService.getAvalancheNetworkXP(isDevMode)
  const chains = await networkService.getNetworks()
  const cChainNetwork =
    chains[
      isDevMode ? ChainId.AVALANCHE_TESTNET_ID : ChainId.AVALANCHE_MAINNET_ID
    ]
  assertNotUndefined(cChainNetwork)

  const avaxProvider = networkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider

  const amt = BigInt(requiredAmount.toString(10))
  const baseFee = await avaxProvider.getApiC().getBaseFee() //in WEI
  const instantFee = baseFee * BigInt(1.2) // Increase by 20% for instant speed

  const pChainFee = calculatePChainFee()
  const amount = amt + BigInt(pChainFee.toString())
  Logger.trace('amount', amount)
  const unsignedTxWithFee = await walletService.createExportCTx(
    amount,
    instantFee,
    activeAccount.index,
    avaxXPNetwork,
    'P',
    activeAccount.addressPVM
  )

  const signedTxWithFee = await walletService.signAvaxTx(
    { tx: unsignedTxWithFee } as AvalancheTransactionRequest,
    activeAccount.index,
    avaxXPNetwork
  )

  const txID = await networkService.sendTransaction(
    signedTxWithFee,
    avaxXPNetwork,
    true
  )
  Logger.trace('txID', txID)

  try {
    await exponentialBackoff(
      () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      result => result.status === 'Accepted',
      5
    )
  } catch (e) {
    Logger.error('exponentialBackoff failed', e)
    return false
  }

  return true
}
