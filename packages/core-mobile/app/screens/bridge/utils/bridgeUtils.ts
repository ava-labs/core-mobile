import {
  Blockchain,
  CriticalConfig,
  getNativeSymbol
} from '@avalabs/core-bridge-sdk'
import { Transaction } from 'store/transaction'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network'
import { BridgeTransfer, Chain } from '@avalabs/bridge-unified'
import { AssetBalance } from './types'

export function isPendingBridgeTransaction(
  item: Transaction | BridgeTransfer
): item is BridgeTransfer {
  return 'addressBTC' in item || 'sourceChain' in item
}

export const blockchainToNetwork = (
  blockChain: Blockchain,
  networks: Networks,
  criticalConfig: CriticalConfig | undefined
): Network | undefined => {
  switch (blockChain) {
    case Blockchain.AVALANCHE:
    case Blockchain.ETHEREUM: {
      const chainId = criticalConfig?.critical.networks[blockChain]
      return typeof chainId === 'number' ? networks[chainId] : undefined
    }
    case Blockchain.BITCOIN: {
      const isTest =
        criticalConfig?.critical.networks[Blockchain.AVALANCHE] !==
        ChainId.AVALANCHE_MAINNET_ID
      return isTest
        ? networks[ChainId.BITCOIN_TESTNET]
        : networks[ChainId.BITCOIN]
    }
    default:
      throw new Error('Blockchain not supported')
  }
}

export const networkToBlockchain = (
  network: Network | undefined
): Blockchain => {
  switch (network?.chainId) {
    case ChainId.AVALANCHE_MAINNET_ID:
    case ChainId.AVALANCHE_LOCAL_ID:
    case ChainId.AVALANCHE_TESTNET_ID:
      return Blockchain.AVALANCHE
    case ChainId.ETHEREUM_HOMESTEAD:
    case ChainId.ETHEREUM_TEST_GOERLY:
    case ChainId.ETHEREUM_TEST_RINKEBY:
    case ChainId.ETHEREUM_TEST_SEPOLIA:
      return Blockchain.ETHEREUM
    case ChainId.BITCOIN:
    case ChainId.BITCOIN_TESTNET:
      return Blockchain.BITCOIN
    default:
      return Blockchain.UNKNOWN
  }
}

export const isBridgeTransfer = (
  transfer?: BridgeTransfer | Transaction
): transfer is BridgeTransfer => {
  return transfer !== undefined && 'type' in transfer
}

export const getNativeTokenSymbol = (chain: Chain): string => {
  if (typeof chain === 'object') {
    return chain.networkToken.symbol
  }

  return getNativeSymbol(chain)
}

export function getOriginalSymbol(symbol: string): string {
  return symbol.replace(/\.(e|b|p)$/i, '')
}

export const getAssetBalance = (
  symbol: string | undefined,
  assetsWithBalances: AssetBalance[]
): AssetBalance | undefined => {
  if (!symbol) {
    return undefined
  }

  return assetsWithBalances.find(({ asset }) => {
    return asset.symbol === symbol
  })
}

export const unwrapAssetSymbol = (symbol: string): string => {
  if (symbol.endsWith('.e') || symbol.endsWith('.b')) {
    return symbol.slice(0, -2) // remove .e
  }

  return symbol
}

export const wrapAssetSymbol = (symbol: string, postfix: string): string => {
  return `${symbol}${postfix}`
}
