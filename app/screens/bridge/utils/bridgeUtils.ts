import {
  Blockchain,
  BridgeTransaction,
  CriticalConfig
} from '@avalabs/bridge-sdk'
import { BitcoinHistoryTx } from '@avalabs/wallets-sdk'
import { Transaction } from 'store/transaction'
import { ChainId, Network } from '@avalabs/chains-sdk'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import { Networks } from 'store/network'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Checking if the transaction is a bridge transaction with Ethereum
 */
export function isBridgeTransactionEVM(
  tx: {
    contractAddress: string
    to: string
    from: string
  },
  network: Network,
  criticalConfig: CriticalConfig | undefined
) {
  if (isEthereumNetwork(network)) {
    const ethBridgeAddress = criticalConfig?.critical.walletAddresses.ethereum
    return (
      tx.to.toLowerCase() === ethBridgeAddress ||
      tx.from.toLowerCase() === ethBridgeAddress
    )
  } else {
    const ethereumAssets = criticalConfig?.critical.assets
    const bitcoinAssets = criticalConfig?.criticalBitcoin?.bitcoinAssets

    if (!ethereumAssets || !bitcoinAssets) return false

    return (
      Object.values<{ wrappedContractAddress: string }>(ethereumAssets)
        .concat(Object.values(bitcoinAssets))
        .some(
          ({ wrappedContractAddress }) =>
            wrappedContractAddress.toLowerCase() ===
            tx.contractAddress.toLowerCase()
        ) &&
      (tx.to.toLowerCase() === NULL_ADDRESS ||
        tx.from.toLowerCase() === NULL_ADDRESS)
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
) => {
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
  item: Transaction | BridgeTransaction
): item is BridgeTransaction {
  return 'addressBTC' in item
}

const blockchainDisplayNameMap = new Map([
  [Blockchain.AVALANCHE, 'Avalanche C-Chain'],
  [Blockchain.ETHEREUM, 'Ethereum'],
  [Blockchain.BITCOIN, 'Bitcoin'],
  [Blockchain.UNKNOWN, '']
])

export function getBlockchainDisplayName(chain: Blockchain | undefined) {
  return blockchainDisplayNameMap.get(chain ?? Blockchain.UNKNOWN) ?? ''
}

export const blockchainToNetwork = (
  blockChain: Blockchain,
  networks: Networks,
  criticalConfig: CriticalConfig | undefined
) => {
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

export const networkToBlockchain = (network: Network | undefined) => {
  switch (network?.chainId) {
    case ChainId.AVALANCHE_MAINNET_ID:
    case ChainId.AVALANCHE_LOCAL_ID:
    case ChainId.AVALANCHE_TESTNET_ID:
      return Blockchain.AVALANCHE
    case ChainId.ETHEREUM_HOMESTEAD:
    case ChainId.ETHEREUM_TEST_GOERLY:
    case ChainId.ETHEREUM_TEST_RINKEBY:
      return Blockchain.ETHEREUM
    case ChainId.BITCOIN:
    case ChainId.BITCOIN_TESTNET:
      return Blockchain.BITCOIN
    default:
      return Blockchain.UNKNOWN
  }
}
