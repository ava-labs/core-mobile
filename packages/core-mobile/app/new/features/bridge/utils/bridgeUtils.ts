import {
  Blockchain,
  BridgeTransaction,
  CriticalConfig,
  getNativeSymbol
} from '@avalabs/core-bridge-sdk'
import { Transaction } from 'store/transaction'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network'
import { BridgeTransfer, Chain } from '@avalabs/bridge-unified'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { AssetBalance } from './types'

export function isPendingBridgeTransaction(
  item: Transaction | BridgeTransaction | BridgeTransfer
): item is BridgeTransaction | BridgeTransfer {
  return 'addressBTC' in item || 'sourceChain' in item
}

const blockchainDisplayNameMap = new Map([
  [Blockchain.AVALANCHE, 'Avalanche C-Chain'],
  [Blockchain.ETHEREUM, 'Ethereum'],
  [Blockchain.BITCOIN, 'Bitcoin'],
  [Blockchain.UNKNOWN, '']
])

export function getBlockchainDisplayName(
  chain: Blockchain | undefined
): string {
  return blockchainDisplayNameMap.get(chain ?? Blockchain.UNKNOWN) ?? ''
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

export const isUnifiedBridgeTransfer = (
  transfer?: BridgeTransaction | BridgeTransfer | Transaction
): transfer is BridgeTransfer => {
  return transfer !== undefined && 'type' in transfer
}

export const getNativeTokenSymbol = (chain: Blockchain | Chain): string => {
  if (typeof chain === 'object') {
    return chain.networkToken.symbol
  }

  return getNativeSymbol(chain)
}

export function getOriginalSymbol(symbol: string): string {
  // get the original symbol without the postfix for network(i.e.: USDC.e -> USDC, BTC.b -> BTC)
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

export function getSourceChainId(
  bridgeTransaction: BridgeTransaction | BridgeTransfer | undefined,
  isTestnet: boolean
): number | undefined {
  if (isUnifiedBridgeTransfer(bridgeTransaction)) {
    return getChainIdForChain(bridgeTransaction.sourceChain, isTestnet)
  } else {
    return getChainIdForBlockchain(bridgeTransaction?.sourceChain, isTestnet)
  }
}

export function getTargetChainId(
  bridgeTransaction: BridgeTransaction | BridgeTransfer | undefined,
  isTestnet: boolean
): number | undefined {
  if (isUnifiedBridgeTransfer(bridgeTransaction)) {
    return getChainIdForChain(bridgeTransaction.targetChain, isTestnet)
  } else {
    return getChainIdForBlockchain(bridgeTransaction?.targetChain, isTestnet)
  }
}

function getChainIdForBlockchain(
  blockchain: Blockchain | undefined,
  isTestnet: boolean
): number {
  switch (blockchain) {
    case Blockchain.BITCOIN:
      return isTestnet ? ChainId.BITCOIN_TESTNET : ChainId.BITCOIN
    case Blockchain.ETHEREUM:
      // ETHEREUM_SEPOLIA doesn't have contract tokens, so always use ETHEREUM_HOMESTEAD chainid.
      return ChainId.ETHEREUM_HOMESTEAD
    case Blockchain.AVALANCHE:
    default:
      return isTestnet
        ? ChainId.AVALANCHE_TESTNET_ID
        : ChainId.AVALANCHE_MAINNET_ID
  }
}

export function getChainIdForChain(
  chain: Chain | undefined,
  isTestnet: boolean
): number | undefined {
  const chainId = chain?.chainId
    ? getChainIdFromCaip2(chain?.chainId)
    : undefined

  if (!chainId) return undefined

  if (isBitcoinChainId(chainId)) {
    return isTestnet ? ChainId.BITCOIN_TESTNET : ChainId.BITCOIN
  }

  if (isEthereumChainId(chainId)) {
    return isTestnet
      ? ChainId.ETHEREUM_TEST_SEPOLIA
      : ChainId.ETHEREUM_HOMESTEAD
  }

  if (isAvalancheChainId(chainId)) {
    return isTestnet
      ? ChainId.AVALANCHE_TESTNET_ID
      : ChainId.AVALANCHE_MAINNET_ID
  }

  return chainId
}

export function getBridgeAssetSymbol(
  bridgeTransaction: BridgeTransaction | BridgeTransfer | undefined
): string | undefined {
  if (isUnifiedBridgeTransfer(bridgeTransaction)) {
    return bridgeTransaction.asset.symbol
  } else {
    return bridgeTransaction?.symbol
  }
}
