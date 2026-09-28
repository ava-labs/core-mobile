import { evm, UnsignedTx } from '@avalabs/avalanchejs'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { FundsStuckError } from 'hooks/earn/errors'
import NetworkService from 'services/network/NetworkService'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import WalletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import { SentryTag } from 'services/sentry/types'
import { weiToNano } from 'utils/units/converter'
import { cChainToken } from 'utils/units/knownTokens'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
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
  xpAddresses: string[]
}

export async function importC({
  walletId,
  walletType,
  account,
  isTestnet,
  cBaseFeeMultiplier,
  xpAddresses
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
  const unsignedTx = await AvalancheWalletService.createImportCTx({
    account,
    baseFeeInNAvax: weiToNano(instantBaseFee.toSubUnit()),
    isTestnet,
    sourceChain: 'P',
    destinationAddress: account.addressC,
    xpAddresses
  })
  const signedTxJson = await WalletService.sign({
    walletId,
    walletType,
    transaction: {
      tx: unsignedTx
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
    // The node sets blockHeight only once the atomic tx is accepted, and it
    // serves Processing and Dropped txs without one, so its presence is the
    // only acceptance signal available here. A tx the node has not indexed yet
    // rejects outright, which retry() treats as another attempt.
    await retry<evm.GetAtomicTxResponse>({
      operation: () => avaxProvider.getApiC().getAtomicTx({ txID }),
      shouldStop: result => result.blockHeight !== undefined,
      maxRetries: maxTransactionStatusCheckRetries
    })
  } catch (e) {
    // Sentry groups by the passed error, which demotes this message to an
    // extra and collapses every earn confirmation failure into one
    // "Max retry exceeded" bucket. Tags survive grouping, so they are what
    // makes this leg findable.
    Logger.error('importC failed', e, {
      source: SentryTag.Earn,
      operation: 'importC'
    })
    throw new FundsStuckError({
      name: 'CONFIRM_IMPORT_FAIL',
      message: 'Import did not finish',
      cause: e
    })
  }

  Logger.info('importing C finished')
}
