import {
  Asset,
  Blockchain,
  BridgeTransaction,
  CriticalConfig,
  getNativeSymbol
} from '@avalabs/core-bridge-sdk'
import { Transaction } from 'store/transaction'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network'
import {
  BridgeAsset,
  BridgeTransfer,
  Chain,
  TokenType
} from '@avalabs/bridge-unified'
import {
  Transaction as InternalTransaction,
  TxToken
} from '@avalabs/vm-module-types'
import { addNamespaceToChain } from 'services/walletconnectv2/utils'
import { AssetBalance } from './types'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Checking if the transaction is a bridge transaction with Ethereum
 */
export function isBridgeTransactionEthereum({
  transaction,
  criticalConfig,
  bridgeAddresses
}: {
  transaction: InternalTransaction
  network: Network
  criticalConfig: CriticalConfig | undefined
  bridgeAddresses: string[]
}): boolean {
  const addressesToCheck = [
    transaction.to.toLowerCase(),
    transaction.from.toLowerCase()
  ]

  const ethBridgeAddress = criticalConfig?.critical.walletAddresses.ethereum

  if (ethBridgeAddress === undefined) return false

  const smartContractAddresses = [ethBridgeAddress, ...bridgeAddresses]

  return addressesToCheck.some(address =>
    smartContractAddresses.includes(address)
  )
}

export function isBridgeTransactionERC20({
  token,
  bridgeAddresses
}: {
  token: TxToken
  bridgeAddresses: string[]
}): boolean {
  return [
    token.to?.address.toLowerCase(),
    token.from?.address.toLowerCase()
  ].some(item => item && [...bridgeAddresses, NULL_ADDRESS].includes(item))
}

/**
 * Checking if the transaction is a bridge transaction with Bitcoin
 */
export const isBridgeTransactionBTC = (
  transaction: InternalTransaction,
  bitcoinWalletAddresses:
    | {
        avalanche: string
        btc: string
      }
    | undefined
): boolean => {
  if (!bitcoinWalletAddresses) {
    return false
  }

  const addresses = transaction.isSender ? [transaction.to] : [transaction.from]
  return addresses.some(address => {
    return [bitcoinWalletAddresses.btc, bitcoinWalletAddresses.avalanche].some(
      walletAddress => address.toLowerCase() === walletAddress.toLowerCase()
    )
  })
}

export function isPendingBridgeTransaction(
  item: Transaction | BridgeTransfer
): item is BridgeTransfer {
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

export const isUnifiedBridgeAsset = (asset: unknown): asset is BridgeAsset => {
  return asset !== null && typeof asset === 'object' && 'destinations' in asset
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

export const getDenomination = (asset: BridgeAsset | Asset): number =>
  isUnifiedBridgeAsset(asset) ? asset.decimals : asset.denomination

export const unwrapAssetSymbol = (symbol: string): string => {
  if (symbol.endsWith('.e')) {
    return symbol.slice(0, -2) // remove .e
  }

  return symbol
}

export const wrapAssetSymbol = (symbol: string): string => {
  return `${symbol}.e` // add .e
}

export const buildChain = (network: Network): Chain => {
  return {
    chainId: addNamespaceToChain(network.chainId), // ictt todo: bitcoin?
    chainName: network.chainName,
    rpcUrl: network.rpcUrl,
    networkToken: {
      ...network.networkToken,
      type: TokenType.NATIVE
    },
    utilityAddresses: {
      multicall: network.utilityAddresses?.multicall as `0x${string}`
    }
  }
}
