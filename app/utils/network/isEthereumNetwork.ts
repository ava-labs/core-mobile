import { Network, ChainId } from '@avalabs/chains-sdk'

export function isEthereumNetwork(network: Network) {
  return isEthereumChainId(network.chainId)
}

export function isEthereumChainId(chainId: number) {
  return (
    ChainId.ETHEREUM_HOMESTEAD === chainId ||
    ChainId.ETHEREUM_TEST_GOERLY === chainId ||
    ChainId.ETHEREUM_TEST_RINKEBY === chainId
  )
}
