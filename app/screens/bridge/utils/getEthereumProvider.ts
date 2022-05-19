import { ChainId, Network } from '@avalabs/chains-sdk'
import { InfuraProvider, JsonRpcProvider } from '@ethersproject/providers'
import Config from 'react-native-config'

const providers: Record<string, JsonRpcProvider> = {}

export function getEthereumProvider(network: Network): JsonRpcProvider {
  const isMainnet = network.chainId === ChainId.AVALANCHE_MAINNET_ID
  const networkName = isMainnet ? 'homestead' : 'rinkeby'

  if (!providers[networkName]) {
    providers[networkName] = new InfuraProvider(
      networkName,
      Config.INFURA_API_KEY
    )
  }

  return providers[networkName]
}
