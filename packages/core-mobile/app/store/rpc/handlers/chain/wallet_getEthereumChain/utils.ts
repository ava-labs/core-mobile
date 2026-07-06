import { Network } from '@avalabs/core-chains-sdk'
import { intToHex } from 'ethereumjs-util'

interface AddEthereumChainParameter {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
  iconUrls?: string[]
}

export const networkToGetEthChainResponse = (
  network: Network
): AddEthereumChainParameter & { isTestnet?: boolean } => ({
  chainId: intToHex(network.chainId),
  chainName: network.chainName,
  rpcUrls: [network.rpcUrl],
  nativeCurrency: {
    name: network.networkToken.name,
    symbol: network.networkToken.symbol,
    decimals: network.networkToken.decimals
  },
  blockExplorerUrls: network.explorerUrl ? [network.explorerUrl] : undefined,
  isTestnet: !!network.isTestnet
})
