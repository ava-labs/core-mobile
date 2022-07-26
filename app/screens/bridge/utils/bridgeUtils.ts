import {Blockchain, BridgeTransaction, CriticalConfig} from '@avalabs/bridge-sdk';
import { BitcoinHistoryTx } from '@avalabs/wallets-sdk'
import { Transaction } from 'store/transaction'
import { Network } from '@avalabs/chains-sdk'
import { isEthereumNetwork } from 'services/network/isEthereumNetwork'
import { Erc20TransferDetailsDto } from '@avalabs/glacier-sdk'

const ETHEREUM_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Checking if the transaction is a bridge transaction with Ethereum
 */
export function isBridgeTransactionEVM(
  tx: Erc20TransferDetailsDto,
  criticalConfig?: CriticalConfig,
  network?: Network
) {
  const ethereumAssets = criticalConfig?.critical.assets
  const bitcoinAssets = criticalConfig?.criticalBitcoin?.bitcoinAssets

  if (!ethereumAssets || !bitcoinAssets) return false
  if (!network) return false

  if (isEthereumNetwork(network)) {
    const ethBridgeAddress = criticalConfig?.critical.walletAddresses.ethereum
    return (
      tx.to.address.toLowerCase() === ethBridgeAddress ||
      tx.from.address.toLowerCase() === ethBridgeAddress
    )
  } else {
    return (
      Object.values(ethereumAssets).some(({ wrappedContractAddress }) => {
        return (
          wrappedContractAddress.toLowerCase() ===
            tx.erc20Token.contractAddress.toLowerCase() &&
          (tx.to.address === ETHEREUM_ADDRESS ||
            tx.from.address === ETHEREUM_ADDRESS)
        )
      }) ||
      Object.values(bitcoinAssets).some(
        ({ wrappedContractAddress }) =>
          wrappedContractAddress.toLowerCase() ===
          tx.erc20Token.contractAddress.toLowerCase()
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

export const blockchainDisplayNameMap = new Map([
  [Blockchain.AVALANCHE, 'Avalanche C-Chain'],
  [Blockchain.ETHEREUM, 'Ethereum'],
  [Blockchain.BITCOIN, 'Bitcoin'],
  [Blockchain.UNKNOWN, '']
])
