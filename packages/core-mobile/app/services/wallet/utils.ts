import { Avalanche } from '@avalabs/core-wallets-sdk'
import { isDevnet } from 'utils/isDevnet'
import { Network } from '@avalabs/core-chains-sdk'
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
