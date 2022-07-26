import {
  Blockchain,
  BridgeTransaction,
  CriticalConfig
} from '@avalabs/bridge-sdk'
import { BitcoinHistoryTx } from '@avalabs/wallets-sdk'
import { Transaction } from 'store/transaction'
import { Network } from '@avalabs/chains-sdk'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'

const ETHEREUM_ADDRESS = '0x0000000000000000000000000000000000000000'

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
      Object.values(ethereumAssets).some(
        ({ wrappedContractAddress }) =>
          wrappedContractAddress.toLowerCase() ===
            tx.contractAddress.toLowerCase() &&
          (tx.to.toLowerCase() === ETHEREUM_ADDRESS ||
            tx.from.toLowerCase() === ETHEREUM_ADDRESS)
      ) ||
      Object.values(bitcoinAssets).some(
        ({ wrappedContractAddress }) =>
          wrappedContractAddress.toLowerCase() ===
          tx.contractAddress.toLowerCase()
      )
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
  return blockchainDisplayNameMap.get(chain ?? Blockchain.UNKNOWN)
}
