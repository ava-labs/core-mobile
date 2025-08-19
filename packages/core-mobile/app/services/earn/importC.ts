import { UnsignedTx } from '@avalabs/avalanchejs'
import { GetAtomicTxStatusResponse } from '@avalabs/avalanchejs/dist/vms/evm'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ErrorBase } from 'errors/ErrorBase'
import { FundsStuckError } from 'hooks/earn/errors'
import NetworkService from 'services/network/NetworkService'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import { weiToNano } from 'utils/units/converter'
import { cChainToken } from 'utils/units/knownTokens'
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
      shouldStop: result => result !== '',
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
    const { status } = await retry<GetAtomicTxStatusResponse>({
      operation: () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      shouldStop: result =>
        result.status === 'Accepted' || result.status === 'Dropped',
      maxRetries: maxTransactionStatusCheckRetries
    })
    if (status === 'Dropped') {
      throw new ErrorBase({
        name: 'IMPORT_DROPPED',
        message: 'Import was dropped',
        cause: new Error('Import was dropped')
      })
    }
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
