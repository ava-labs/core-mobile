import { ChainId } from '@avalabs/chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import { calculatePChainFee } from 'services/earn/calculateCrossChainFees'
import BN from 'bn.js'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import NetworkService from 'services/network/NetworkService'

export type ExportCParams = {
  /**
   * in nAvax
   */
  cChainBalance: BN
  /**
   * in nAvax
   */
  requiredAmount: BN
  activeAccount: Account
  isDevMode: boolean
}

export async function exportC({
  cChainBalance,
  requiredAmount,
  activeAccount,
  isDevMode
}: ExportCParams): Promise<boolean> {
  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)
  const chains = await NetworkService.getNetworks()
  const cChainNetwork =
    chains[
      isDevMode ? ChainId.AVALANCHE_TESTNET_ID : ChainId.AVALANCHE_MAINNET_ID
    ]
  assertNotUndefined(cChainNetwork)

  const avaxProvider = NetworkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider

  const amt = BigInt(requiredAmount.toString(10))
  const baseFee = await avaxProvider.getApiC().getBaseFee() //in WEI
  const instantFee = baseFee + (baseFee * BigInt(20)) / BigInt(100) // Increase by 20% for instant speed

  const pChainFee = calculatePChainFee()
  const amount = amt + BigInt(pChainFee.toString())
  Logger.trace('amount', amount)

  if (cChainBalance.lt(new BN(amount.toString()))) {
    throw Error('Not enough balance on C chain')
  }

  const unsignedTxWithFee = await WalletService.createExportCTx(
    amount,
    instantFee,
    activeAccount.index,
    avaxXPNetwork,
    'P',
    activeAccount.addressPVM
  )

  const signedTxWithFeeJson = await WalletService.sign(
    { tx: unsignedTxWithFee } as AvalancheTransactionRequest,
    activeAccount.index,
    avaxXPNetwork
  )
  const signedTxWithFee = UnsignedTx.fromJSON(signedTxWithFeeJson).getSignedTx()

  const txID = await NetworkService.sendTransaction(
    signedTxWithFee,
    avaxXPNetwork
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
