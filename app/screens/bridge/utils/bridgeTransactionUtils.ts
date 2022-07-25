import capitalize from 'lodash.capitalize'
import {
  BitcoinConfigAssets,
  Blockchain,
  BridgeTransaction,
  EthereumConfigAssets
} from '@avalabs/bridge-sdk'
import { Erc20TransferDetailsDto } from '@avalabs/glacier-sdk'
import { BitcoinHistoryTx } from '@avalabs/wallets-sdk'
import { Transaction } from 'store/transaction'

const ETHEREUM_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Checking if the transaction is a bridge transaction with Ethereum
 */
export function isBridgeTransactionEVM(
  transaction: Erc20TransferDetailsDto,
  ethereumWrappedAssets: EthereumConfigAssets | undefined,
  bitcoinAssets: BitcoinConfigAssets | undefined
) {
  if (!ethereumWrappedAssets || !bitcoinAssets) return false

  return (
    Object.values(ethereumWrappedAssets).some(
      ({ wrappedContractAddress }) =>
        wrappedContractAddress.toLowerCase() ===
          transaction.erc20Token.contractAddress.toLowerCase() &&
        (transaction.to.address === ETHEREUM_ADDRESS ||
          transaction.from.address === ETHEREUM_ADDRESS)
    ) ||
    Object.values(bitcoinAssets).some(
      ({ wrappedContractAddress }) =>
        wrappedContractAddress.toLowerCase() ===
        transaction.erc20Token.contractAddress.toLowerCase()
    )
  )
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

export function formatBlockchain(chain: Blockchain | undefined): string {
  return chain === Blockchain.AVALANCHE
    ? 'Avalanche C-Chain'
    : capitalize(chain)
}
