import { Network } from '@avalabs/chains-sdk'
import {
  JsonRpcProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers'

const providers: Record<string, JsonRpcProvider> = {}

export function getAvalancheProvider(network: Network): JsonRpcProvider {
  const chainId = network.chainId

  if (network && !providers[chainId]) {
    const avalancheProvider = new StaticJsonRpcProvider(network.rpcUrl)
    avalancheProvider.pollingInterval = 1000
    providers[chainId] = avalancheProvider
  }

  return providers[chainId]
}
