import { Avalanche } from '@avalabs/core-wallets-sdk'
import { isDevnet } from 'utils/isDevnet'
import { Network } from '@avalabs/core-chains-sdk'
import { makeBigIntLike } from 'utils/makeBigIntLike'
import { BytesLike, AddressLike } from '@ethereumjs/util'
import { LegacyTxData } from '@ethereumjs/tx'
import { TransactionRequest } from 'ethers'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SignTransactionRequest
} from './types'

export const MAINNET_AVAX_ASSET_ID = Avalanche.MainnetContext.avaxAssetID
export const TESTNET_AVAX_ASSET_ID = Avalanche.FujiContext.avaxAssetID
export const DEVNET_AVAX_ASSET_ID = Avalanche.DevnetContext.avaxAssetID

export const isBtcTransactionRequest = (
  request: SignTransactionRequest
): request is BtcTransactionRequest => {
  return 'inputs' in request
}

export const isAvalancheTransactionRequest = (
  request: SignTransactionRequest
): request is AvalancheTransactionRequest => {
  return 'tx' in request
}

export const getAssetId = (avaxXPNetwork: Network): string => {
  return isDevnet(avaxXPNetwork)
    ? DEVNET_AVAX_ASSET_ID
    : avaxXPNetwork.isTestnet
    ? TESTNET_AVAX_ASSET_ID
    : MAINNET_AVAX_ASSET_ID
}

/**
 * Convert tx data from `TransactionRequest` (ethers) to `TxData` (@ethereumjs)
 */
export function convertTxData(txData: TransactionRequest): LegacyTxData {
  return {
    to: txData.to?.toString() as AddressLike,
    nonce: makeBigIntLike(txData.nonce),
    gasPrice: makeBigIntLike(txData.gasPrice),
    gasLimit: makeBigIntLike(txData.gasLimit),
    value: makeBigIntLike(txData.value),
    data: txData.data as BytesLike,
    type: makeBigIntLike(txData.type)
  }
}
