import { ChainId } from '@avalabs/chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { Avalanche } from '@avalabs/wallets-sdk'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import { calculatePChainFee } from 'services/earn/calculateCrossChainFees'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs'
import NetworkService from 'services/network/NetworkService'
import { Avax } from 'types/Avax'
import { FundsStuckError } from 'hooks/earn/errors'
import { maxTransactionStatusCheckRetries } from './utils'

export type ExportCParams = {
  cChainBalance: Avax
  requiredAmount: Avax
  activeAccount: Account
  isDevMode: boolean
}

export async function exportC({
  cChainBalance,
  requiredAmount,
  activeAccount,
  isDevMode
}: ExportCParams): Promise<void> {
  Logger.info('exporting C started')

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

  const baseFee = Avax.fromWei(await avaxProvider.getApiC().getBaseFee())
  const instantBaseFee = WalletService.getInstantBaseFee(baseFee)

  const pChainFee = calculatePChainFee()
  const amount = requiredAmount.add(pChainFee)

  if (cChainBalance.lt(amount)) {
    throw Error('Not enough balance on C chain')
  }

  const unsignedTxWithFee = await WalletService.createExportCTx({
    amount,
    baseFee: instantBaseFee,
    accountIndex: activeAccount.index,
    avaxXPNetwork,
    destinationChain: 'P',
    destinationAddress: activeAccount.addressPVM
  })

  const signedTxWithFeeJson = await WalletService.sign(
    { tx: unsignedTxWithFee } as AvalancheTransactionRequest,
    activeAccount.index,
    avaxXPNetwork
  )
  const signedTxWithFee = UnsignedTx.fromJSON(signedTxWithFeeJson).getSignedTx()

  const txID = await NetworkService.sendTransaction({
    signedTx: signedTxWithFee,
    network: avaxXPNetwork
  })
  Logger.trace('txID', txID)

  try {
    await retry({
      operation: () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      isSuccess: result => result.status === 'Accepted',
      maxRetries: maxTransactionStatusCheckRetries
    })
  } catch (e) {
    Logger.error('exportC failed', e)
    throw new FundsStuckError({
      name: 'CONFIRM_EXPORT_FAIL',
      message: 'Export did not finish',
      cause: e
    })
  }

  Logger.info('exporting C ended')
}
