import {
  Blockchain,
  BridgeTransaction,
  CriticalConfig,
  getNativeSymbol
} from '@avalabs/bridge-sdk'
import { BitcoinHistoryTx } from '@avalabs/wallets-sdk'
import { Transaction } from 'store/transaction'
import { ChainId, Network } from '@avalabs/chains-sdk'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import { Networks } from 'store/network'
import { BridgeAsset, BridgeTransfer, Chain } from '@avalabs/bridge-unified'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Checking if the transaction is a bridge transaction with Ethereum
 */
export function isBridgeTransactionEVM({
  tx,
  network,
  criticalConfig,
  bridgeAddresses
}: {
  tx: {
    contractAddress: string
    to: string
    from: string
  }
  network: Network
  criticalConfig: CriticalConfig | undefined
  bridgeAddresses: string[]
}): boolean {
  const addressesToCheck = [tx.to.toLowerCase(), tx.from.toLowerCase()]

  if (isEthereumNetwork(network)) {
    const ethBridgeAddress = criticalConfig?.critical.walletAddresses.ethereum

    if (ethBridgeAddress === undefined) return false

    const smartContractAddresses = [ethBridgeAddress, ...bridgeAddresses]

    return addressesToCheck.some(address =>
      smartContractAddresses.includes(address)
    )
  } else {
    const ethereumAssets = criticalConfig?.critical.assets
    const bitcoinAssets = criticalConfig?.criticalBitcoin?.bitcoinAssets

    if (!ethereumAssets || !bitcoinAssets) return false

    if (addressesToCheck.some(address => bridgeAddresses.includes(address))) {
      return true
    }

    return (
      Object.values<{ wrappedContractAddress: string }>(ethereumAssets)
        .concat(Object.values(bitcoinAssets))
        .some(
          ({ wrappedContractAddress }) =>
            wrappedContractAddress.toLowerCase() ===
            tx.contractAddress.toLowerCase()
        ) && addressesToCheck.includes(NULL_ADDRESS)
    )
  }
}

/**
 * Checking if the transaction is a bridge transaction with Bitcoin
 */
export const isBridgeTransactionBTC = (
  transaction: BitcoinHistoryTx,
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

  return transaction.addresses.some(address => {
    return [bitcoinWalletAddresses.btc, bitcoinWalletAddresses.avalanche].some(
      walletAddress => address.toLowerCase() === walletAddress.toLowerCase()
    )
  })
}

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
