import { Blockchain } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'

function getAvalancheTxLink(hash: string, isMainnet = true) {
  const root = isMainnet
    ? 'https://snowtrace.io'
    : 'https://testnet.snowtrace.io'
  return `${root}/tx/${hash}`
}

function getEtherscanLink(txHash: string, isMainnet: boolean) {
  const root = isMainnet
    ? 'https://etherscan.io'
    : 'https://rinkeby.etherscan.io'
  return `${root}/tx/${txHash}`
}

function getBTCBlockchainLink(txHash: string, isMainnet: boolean) {
  const env = isMainnet ? 'btc' : 'btc-testnet'
  return `https://www.blockchain.com/${env}/tx/${txHash}`
}
export function getExplorerAddress(
  chain: Blockchain,
  txHash: string,
  isMainnet: boolean
) {
  switch (chain) {
    case Blockchain.AVALANCHE:
      return getAvalancheTxLink(txHash, isMainnet)
    case Blockchain.BITCOIN:
      return getBTCBlockchainLink(txHash, isMainnet)
    default:
      return getEtherscanLink(txHash, isMainnet)
  }
}

export function getExplorerAddressByNetwork(
  network: Network,
  hash: string,
  hashType: 'address' | 'tx' = 'tx'
) {
  return `${network.explorerUrl}/${hashType}/${hash}`
}
