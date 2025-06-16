import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { UnsignedTx } from '@avalabs/avalanchejs'
import { FundsStuckError } from 'hooks/earn/errors'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { cChainToken } from 'utils/units/knownTokens'
import { weiToNano } from 'utils/units/converter'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import {
  maxTransactionCreationRetries,
  maxTransactionStatusCheckRetries
} from './utils'

export type ImportCParams = {
  walletId: string
  walletType: WalletType
  activeAccount: Account
  isDevMode: boolean
  cBaseFeeMultiplier: number
}

export async function importC({
  walletId,
  walletType,
  activeAccount,
  isDevMode,
  cBaseFeeMultiplier
}: ImportCParams): Promise<void> {
  Logger.info(
    `importing C started with base fee multiplier: ${cBaseFeeMultiplier}`
  )

  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)
  const avaxProvider = await NetworkService.getAvalancheProviderXP(isDevMode)

  const baseFee = await avaxProvider.getApiC().getBaseFee() //in WEI
  const baseFeeAvax = new TokenUnit(
    baseFee,
    cChainToken.maxDecimals,
    cChainToken.symbol
  )
  const instantBaseFee = addBufferToCChainBaseFee(
    baseFeeAvax,
    cBaseFeeMultiplier
  )
  const unsignedTx = await WalletService.createImportCTx({
    walletId,
    walletType,
    accountIndex: activeAccount.index,
    baseFeeInNAvax: weiToNano(instantBaseFee.toSubUnit()),
    avaxXPNetwork,
    sourceChain: 'P',
    destinationAddress: activeAccount.addressC
  })

  const signedTxJson = await WalletService.sign({
    walletId,
    walletType,
    transaction: {
      tx: unsignedTx,
      externalIndices: [],
      internalIndices: []
    } as AvalancheTransactionRequest,
    accountIndex: activeAccount.index,
    network: avaxXPNetwork
  })
  const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

  let txID: string
  try {
    txID = await retry({
      operation: () =>
        NetworkService.sendTransaction({ signedTx, network: avaxXPNetwork }),
      isSuccess: result => result !== '',
      maxRetries: maxTransactionCreationRetries
    })
  } catch (e) {
    Logger.error('ISSUE_IMPORT_FAIL', e)
    throw new FundsStuckError({
      name: 'ISSUE_IMPORT_FAIL',
      message: 'Sending import transaction failed ',
      cause: e
    })
  }

  Logger.trace('txID', txID)

  try {
    await retry({
      operation: () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      isSuccess: result => result.status === 'Accepted',
      maxRetries: maxTransactionStatusCheckRetries
    })
  } catch (e) {
    Logger.error('importC failed', e)
    throw new FundsStuckError({
      name: 'CONFIRM_IMPORT_FAIL',
      message: 'Import did not finish',
      cause: e
    })
  }

  Logger.info('importing C finished')
}
