import { UnsignedTx } from '@avalabs/avalanchejs'
import { GetAtomicTxStatusResponse } from '@avalabs/avalanchejs/dist/vms/evm/model'
import { FundsStuckError } from 'hooks/earn/errors'
import NetworkService from 'services/network/NetworkService'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account/types'
import { AvaxC } from 'types/AvaxC'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import { weiToNano } from 'utils/units/converter'
import { maxTransactionStatusCheckRetries } from './utils'
import { ErrorBase } from 'errors/ErrorBase'

export type ExportCParams = {
  walletId: string
  walletType: WalletType
  cChainBalanceWei: bigint
  requiredAmountWei: bigint // this amount should already include the fee to export
  activeAccount: Account
  isDevMode: boolean
  cBaseFeeMultiplier: number
}

export async function exportC({
  walletId,
  walletType,
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
    walletId,
    walletType,
    amountInNAvax: weiToNano(requiredAmountAvax.toSubUnit()),
    baseFeeInNAvax: weiToNano(instantBaseFeeAvax.toSubUnit()),
    accountIndex: activeAccount.index,
    avaxXPNetwork,
    destinationChain: 'P',
    destinationAddress: activeAccount.addressPVM
  })

  const signedTxWithFeeJson = await WalletService.sign({
    walletId,
    walletType,
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
    const { status } = await retry<GetAtomicTxStatusResponse>({
      operation: () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      shouldStop: result =>
        result.status === 'Accepted' || result.status === 'Dropped',
      maxRetries: maxTransactionStatusCheckRetries
    })
    if (status === 'Dropped') {
      throw new ErrorBase({
        name: 'EXPORT_DROPPED',
        message: 'Export was dropped',
        cause: new Error('Export was dropped')
      })
    }
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
