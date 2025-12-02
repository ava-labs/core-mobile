import { evm, UnsignedTx } from '@avalabs/avalanchejs'
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
  account: Account
  isTestnet: boolean
  cBaseFeeMultiplier: number
}

export async function importC({
  walletId,
  walletType,
  account,
  isTestnet,
  cBaseFeeMultiplier
}: ImportCParams): Promise<void> {
  Logger.info(
    `importing C started with base fee multiplier: ${cBaseFeeMultiplier}`
  )

  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isTestnet)
  const avaxProvider = await NetworkService.getAvalancheProviderXP(isTestnet)

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
    account,
    baseFeeInNAvax: weiToNano(instantBaseFee.toSubUnit()),
    isTestnet,
    sourceChain: 'P',
    destinationAddress: account.addressC
  })

  const signedTxJson = await WalletService.sign({
    walletId,
    walletType,
    transaction: {
      tx: unsignedTx,
      externalIndices: [],
      internalIndices: []
    } as AvalancheTransactionRequest,
    accountIndex: account.index,
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
    const { status } = await retry<evm.GetAtomicTxStatusResponse>({
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
