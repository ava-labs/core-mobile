import { InfuraProvider, JsonRpcProvider } from '@ethersproject/providers'
import { MAINNET_NETWORK, Network } from 'store/network'
import Config from 'react-native-config'

const providers: Record<string, JsonRpcProvider> = {}

export function getEthereumProvider(network: Network): JsonRpcProvider {
  const isMainnet = network.chainId === MAINNET_NETWORK.chainId
  const networkName = isMainnet ? 'homestead' : 'rinkeby'

  if (!providers[networkName]) {
    providers[networkName] = new InfuraProvider(
      networkName,
      Config.INFURA_API_KEY
    )
  }

  return providers[networkName]
}
