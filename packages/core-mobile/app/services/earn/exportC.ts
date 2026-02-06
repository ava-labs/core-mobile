import { evm, UnsignedTx } from '@avalabs/avalanchejs'
import { ErrorBase } from 'errors/ErrorBase'
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
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { maxTransactionStatusCheckRetries } from './utils'

export type ExportCParams = {
  walletId: string
  walletType: WalletType
  cChainBalanceWei: bigint
  requiredAmountWei: bigint // this amount should already include the fee to export
  account: Account
  isTestnet: boolean
  cBaseFeeMultiplier: number
  avalancheEvmProvider: JsonRpcBatchInternal
  xpAddresses: string[]
}

export async function exportC({
  walletId,
  walletType,
  cChainBalanceWei,
  requiredAmountWei,
  account,
  isTestnet,
  cBaseFeeMultiplier,
  avalancheEvmProvider,
  xpAddresses
}: ExportCParams): Promise<void> {
  Logger.info(
    `exporting C started with base fee multiplier: ${cBaseFeeMultiplier}`
  )

  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isTestnet)

  const avaxProvider = await NetworkService.getAvalancheProviderXP(isTestnet)

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

  const unsignedTxWithFee = await AvalancheWalletService.createExportCTx({
    amountInNAvax: weiToNano(requiredAmountAvax.toSubUnit()),
    baseFeeInNAvax: weiToNano(instantBaseFeeAvax.toSubUnit()),
    account,
    isTestnet,
    destinationChain: 'P',
    destinationAddress: account.addressPVM,
    avalancheEvmProvider,
    xpAddresses
  })

  const signedTxWithFeeJson = await WalletService.sign({
    walletId,
    walletType,
    transaction: {
      tx: unsignedTxWithFee
    } as AvalancheTransactionRequest,
    accountIndex: account.index,
    network: avaxXPNetwork
  })
  const signedTxWithFee = UnsignedTx.fromJSON(signedTxWithFeeJson).getSignedTx()

  const txID = await NetworkService.sendTransaction({
    signedTx: signedTxWithFee,
    network: avaxXPNetwork
  })

  Logger.trace('txID', txID)

  try {
    const { status } = await retry<evm.GetAtomicTxStatusResponse>({
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
