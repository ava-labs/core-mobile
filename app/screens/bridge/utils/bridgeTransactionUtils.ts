import {
  BitcoinConfigAssets,
  Blockchain,
  BridgeTransaction,
  EthereumConfigAssets
} from '@avalabs/bridge-sdk'
import { Erc20TransferDetailsDto } from '@avalabs/glacier-sdk'
import { getTransactionLink } from '@avalabs/wallet-react-components'
import { Transaction } from 'store/transaction'

const ETHEREUM_ADDRESS = '0x0000000000000000000000000000000000000000'

export function isBridgeTransaction(
  transfer: Erc20TransferDetailsDto,
  ethereumWrappedAssets: EthereumConfigAssets,
  bitcoinAssets: BitcoinConfigAssets
) {
  return (
    isBridgeTransactionEVM(transfer, ethereumWrappedAssets) ||
    isBridgeTransactionBTC(transfer, bitcoinAssets)
  )
}

export function isBridgeTransactionEVM(
  transfer: Erc20TransferDetailsDto,
  ethereumWrappedAssets: EthereumConfigAssets
): boolean {
  return Object.values(ethereumWrappedAssets).some(
    ({ wrappedContractAddress }) =>
      wrappedContractAddress.toLowerCase() ===
        transfer.erc20Token.contractAddress.toLowerCase() &&
      (transfer.to.address === ETHEREUM_ADDRESS ||
        transfer.from.address === ETHEREUM_ADDRESS)
  )
}

export function isBridgeTransactionBTC(
  tx: Erc20TransferDetailsDto,
  bitcoinAssets: BitcoinConfigAssets
): boolean {
  return Object.values(bitcoinAssets).some(
    ({ wrappedContractAddress }) =>
      wrappedContractAddress.toLowerCase() ===
      tx.erc20Token.contractAddress.toLowerCase()
  )
}

export function isPendingBridgeTransaction(
  item: Transaction | BridgeTransaction
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
