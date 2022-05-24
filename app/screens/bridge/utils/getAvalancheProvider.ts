import {
  JsonRpcProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers'
import { Network } from 'store/network'

const providers: Record<string, JsonRpcProvider> = {}

export function getAvalancheProvider(network: Network): JsonRpcProvider {
  const chainId = network.chainId

  if (network && !providers[chainId]) {
    const avalancheProvider = new StaticJsonRpcProvider(network.config.rpcUrl.c)
    avalancheProvider.pollingInterval = 1000
    providers[chainId] = avalancheProvider
  }

  return providers[chainId]
}
