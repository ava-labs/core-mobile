import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account/types'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs'
import NetworkService from 'services/network/NetworkService'
import { FundsStuckError } from 'hooks/earn/errors'
import { AvaxC } from 'types/AvaxC'
import { weiToNano } from 'utils/units/converter'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import { maxTransactionStatusCheckRetries } from './utils'

export type ExportCParams = {
  cChainBalanceWei: bigint
  requiredAmountWei: bigint // this amount should already include the fee to export
  activeAccount: Account
  isDevMode: boolean
  cBaseFeeMultiplier: number
}

export async function exportC({
  cChainBalanceWei,
  requiredAmountWei,
  activeAccount,
  isDevMode,
  cBaseFeeMultiplier
}: ExportCParams): Promise<void> {
  Logger.info(
    `exporting C started with base fee multiplier: ${cBaseFeeMultiplier}`
  )

  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)

  const avaxProvider = await NetworkService.getAvalancheProviderXP(isDevMode)

  const baseFeeAvax = AvaxC.fromWei(await avaxProvider.getApiC().getBaseFee())

  const instantBaseFeeAvax = addBufferToCChainBaseFee(
    baseFeeAvax,
    cBaseFeeMultiplier
  )

  const cChainBalanceAvax = AvaxC.fromWei(cChainBalanceWei)
  const requiredAmountAvax = AvaxC.fromWei(requiredAmountWei)

  if (cChainBalanceAvax.lt(requiredAmountAvax)) {
    throw Error('Not enough balance on C chain')
  }

  const unsignedTxWithFee = await WalletService.createExportCTx({
    amountInNAvax: weiToNano(requiredAmountAvax.toSubUnit()),
    baseFeeInNAvax: weiToNano(instantBaseFeeAvax.toSubUnit()),
    walletId: activeAccount.walletId,
    accountIndex: activeAccount.index,
    avaxXPNetwork,
    destinationChain: 'P',
    destinationAddress: activeAccount.addressPVM
  })

  const signedTxWithFeeJson = await WalletService.sign({
    transaction: { tx: unsignedTxWithFee } as AvalancheTransactionRequest,
    walletId: activeAccount.walletId,
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
