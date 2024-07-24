import { Blockchain } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'

function getAvalancheTxLink(hash: string, isMainnet = true): string {
  const root = isMainnet
    ? 'https://subnets.avax.network/c-chain'
    : 'https://subnets-test.avax.network/c-chain'

  return `${root}/tx/${hash}`
}

function getEtherscanLink(txHash: string, isMainnet: boolean): string {
  const root = isMainnet
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io'
  return `${root}/tx/${txHash}`
}

function getBTCBlockchainLink(txHash: string, isMainnet: boolean): string {
  const env = isMainnet ? 'btc' : 'btc-testnet'
  return `https://www.blockchain.com/${env}/tx/${txHash}`
}
export function getExplorerAddress(
  chain: Blockchain,
  txHash: string,
  isMainnet: boolean
): string {
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
): string {
  return `${network.explorerUrl}/${hashType}/${hash}`
}
