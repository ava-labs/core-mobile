import { Avalanche } from '@avalabs/core-wallets-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SignTransactionRequest
} from './types'

export const MAINNET_AVAX_ASSET_ID = Avalanche.MainnetContext.avaxAssetID
export const TESTNET_AVAX_ASSET_ID = Avalanche.FujiContext.avaxAssetID

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
  return avaxXPNetwork.isTestnet ? TESTNET_AVAX_ASSET_ID : MAINNET_AVAX_ASSET_ID
}

// we add some buffer to C chain base fee to gain better speed
export const addBufferToCChainBaseFee = (
  baseFee: TokenUnit,
  multiplier: number
): TokenUnit => {
  return baseFee.add(baseFee.mul(multiplier))
}
