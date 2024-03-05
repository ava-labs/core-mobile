import { Network } from '@avalabs/chains-sdk'
import { AddEthereumChainParameter } from '@avalabs/bridge-sdk'
import { intToHex } from 'ethereumjs-util'

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
