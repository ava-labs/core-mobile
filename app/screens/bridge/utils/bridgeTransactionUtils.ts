import {
  BitcoinConfigAssets,
  Blockchain,
  BridgeTransaction,
  EthereumConfigAssets
} from '@avalabs/bridge-sdk'
import {
  getTransactionLink,
  isTransactionERC20,
  TransactionERC20,
  WalletState
} from '@avalabs/wallet-react-components'

type HistoryTx = WalletState['recentTxHistory'][0]

export function isBridgeTransaction(
  tx: HistoryTx,
  ethereumWrappedAssets: EthereumConfigAssets,
  bitcoinAssets: BitcoinConfigAssets
): tx is TransactionERC20 {
  return (
    isTransactionERC20(tx) &&
    (isBridgeTransactionEVM(tx, ethereumWrappedAssets) ||
      isBridgeTransactionBTC(tx, bitcoinAssets))
  )
}

export function isBridgeTransactionEVM(
  tx: TransactionERC20,
  ethereumWrappedAssets: EthereumConfigAssets
): boolean {
  return Object.values(ethereumWrappedAssets).some(
    ({ wrappedContractAddress }) =>
      wrappedContractAddress.toLowerCase() ===
        tx.contractAddress.toLowerCase() &&
      (tx.to === '0x0000000000000000000000000000000000000000' ||
        tx.from === '0x0000000000000000000000000000000000000000')
  )
}

export function isBridgeTransactionBTC(
  tx: TransactionERC20,
  bitcoinAssets: BitcoinConfigAssets
): boolean {
  return Object.values(bitcoinAssets).some(
    ({ wrappedContractAddress }) =>
      wrappedContractAddress.toLowerCase() === tx.contractAddress.toLowerCase()
  )
}

export function isPendingBridgeTransaction(
  item: TransactionERC20 | BridgeTransaction
): item is BridgeTransaction {
  return 'addressBTC' in item
}

export function getLinkForBridgeTransaction(
  chain: Blockchain,
  txHash: string,
  isMainnet: boolean
): string {
  switch (chain) {
    case Blockchain.AVALANCHE:
      return getTransactionLink(txHash, isMainnet)
    case Blockchain.BITCOIN:
      return getBTCBlockchainLink(txHash, isMainnet)
    default:
      return getEtherscanLink(txHash, isMainnet)
  }
}

export function getEtherscanLink(txHash: string, isMainnet: boolean) {
  const root = isMainnet
    ? 'https://etherscan.io'
    : 'https://rinkeby.etherscan.io'
  return `${root}/tx/${txHash}`
}

export function getBTCBlockchainLink(txHash: string, isMainnet: boolean) {
  const env = isMainnet ? 'btc' : 'btc-testnet'
  return `https://www.blockchain.com/${env}/tx/${txHash}`
}
