import { evm, UnsignedTx } from '@avalabs/avalanchejs'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ErrorBase } from 'errors/ErrorBase'
import { FundsStuckError } from 'hooks/earn/errors'
import NetworkService from 'services/network/NetworkService'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import WalletService from 'services/wallet/WalletService'
import { Account, XPAddressDictionary } from 'store/account'
import { retry } from 'utils/js/retry'
import Logger from 'utils/Logger'
import { weiToNano } from 'utils/units/converter'
import { cChainToken } from 'utils/units/knownTokens'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { getInternalExternalAddrs } from 'common/hooks/send/utils/getInternalExternalAddrs'
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
  xpAddressDictionary: XPAddressDictionary
}

export async function importC({
  walletId,
  walletType,
  account,
  isTestnet,
  cBaseFeeMultiplier,
  xpAddresses,
  xpAddressDictionary
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

  // Log UTXO info for debugging Ledger signing issues
  Logger.info('Import C transaction created', {
    utxoCount: unsignedTx.utxos?.length ?? 0,
    addressCount: unsignedTx.addressMaps?.getAddresses().length ?? 0
  })

  // Log xpAddressDictionary to check if it's defined
  Logger.info('xpAddressDictionary check:', {
    isDefined: xpAddressDictionary !== undefined,
    isNull: xpAddressDictionary === null,
    keys: xpAddressDictionary ? Object.keys(xpAddressDictionary).length : 0
  })

  const indices = getInternalExternalAddrs({
    utxos: unsignedTx.utxos,
    xpAddressDict: xpAddressDictionary,
    isTestnet
  })
  Logger.info('UTXO indices for Ledger:', {
    hasExternalIndices: indices.externalIndices !== undefined,
    externalCount: indices.externalIndices?.length ?? 0,
    hasInternalIndices: indices.internalIndices !== undefined,
    internalCount: indices.internalIndices?.length ?? 0
  })

  const signedTxJson = await WalletService.sign({
    walletId,
    walletType,
    transaction: {
      tx: unsignedTx,
      ...indices
    } as AvalancheTransactionRequest,
    accountIndex: account.index,
    network: avaxXPNetwork
  })
  const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

  let txID: string
  try {
    Logger.info('Starting Import C sendTransaction with retry...')
    txID = await retry({
      operation: async (retryIndex) => {
        Logger.info(`Import C sendTransaction attempt ${retryIndex + 1}`)
        try {
          const result = await NetworkService.sendTransaction({
            signedTx,
            network: avaxXPNetwork
          })
          Logger.info(`Import C result: "${result}"`)
          Logger.info(
            `Result type: ${typeof result}, length: ${
              result?.length
            }, isEmpty: ${result === ''}`
          )
          return result
        } catch (error) {
          Logger.error(`Import C sendTransaction attempt ${retryIndex + 1} failed:`, error)
          throw error
        }
      },
      shouldStop: result => result !== '',
      maxRetries: maxTransactionCreationRetries
    })
  } catch (e) {
    Logger.error('ISSUE_IMPORT_FAIL - All sendTransaction retries exhausted:', e)
    throw new FundsStuckError({
      name: 'ISSUE_IMPORT_FAIL',
      message: 'Sending import transaction failed ',
      cause: e
    })
  }

  Logger.info('Import C txID:', txID)
  Logger.info('View on explorer:', `https://subnets-test.avax.network/c-chain/tx/${txID}`)

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
