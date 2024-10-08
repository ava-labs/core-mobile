import { ChainId } from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import { calculatePChainFee } from 'services/earn/calculateCrossChainFees'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account/types'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs'
import NetworkService from 'services/network/NetworkService'
import { FundsStuckError } from 'hooks/earn/errors'
import { AvaxC } from 'types/AvaxC'
import { maxTransactionStatusCheckRetries } from './utils'

export type ExportCParams = {
  cChainBalance: bigint
  requiredAmount: bigint
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

  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)
  const chains = await NetworkService.getNetworks()
  const cChainNetwork =
    chains[
      isDevMode ? ChainId.AVALANCHE_TESTNET_ID : ChainId.AVALANCHE_MAINNET_ID
    ]
  assertNotUndefined(cChainNetwork)

  const avaxProvider = NetworkService.getAvalancheProviderXP(isDevMode)

  const baseFeeAvax = AvaxC.fromWei(await avaxProvider.getApiC().getBaseFee())
  const instantBaseFeeAvax = WalletService.getInstantBaseFee(baseFeeAvax)

  const cChainBalanceAvax = AvaxC.fromWei(cChainBalance)
  const requiredAmountAvax = AvaxC.fromWei(requiredAmount)
  const pChainFeeAvax = calculatePChainFee()
  const amountAvax = requiredAmountAvax.add(pChainFeeAvax)

  if (cChainBalanceAvax.lt(amountAvax)) {
    throw Error('Not enough balance on C chain')
  }

  const unsignedTxWithFee = await WalletService.createExportCTx({
    amount: amountAvax.toSubUnit(),
    baseFee: instantBaseFeeAvax.toSubUnit(),
    accountIndex: activeAccount.index,
    avaxXPNetwork,
    destinationChain: 'P',
    destinationAddress: activeAccount.addressPVM
  })

  const signedTxWithFeeJson = await WalletService.sign({
    transaction: { tx: unsignedTxWithFee } as AvalancheTransactionRequest,
    accountIndex: activeAccount.index,
    network: avaxXPNetwork
  })
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
