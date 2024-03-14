import { Network } from '@avalabs/chains-sdk'
import {
  createPublicClient,
  http,
  PublicClientConfig,
  WaitForTransactionReceiptReturnType
} from 'viem'
import { avalanche, avalancheFuji, mainnet, sepolia } from 'viem/chains'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'
import { addGlacierAPIKeyIfNeeded } from './network/glacier'

const getEthereumNetworkConfig = (
  network: Network,
  isTestnet: boolean
): PublicClientConfig => {
  const url = addGlacierAPIKeyIfNeeded(network.rpcUrl)
  return { chain: isTestnet ? mainnet : sepolia, transport: http(url) }
}

const getAvalancheNetworkConfig = (isTestnet: boolean): PublicClientConfig => {
  return { chain: isTestnet ? avalancheFuji : avalanche, transport: http() }
}

export const getTxConfirmationReceipt = async (
  hash: string | `0x${string}`,
  network: Network,
  isTestnet = false
): Promise<WaitForTransactionReceiptReturnType> => {
  const publicClient = createPublicClient(
    isAvalancheNetwork(network)
      ? getAvalancheNetworkConfig(isTestnet)
      : getEthereumNetworkConfig(network, isTestnet)
  )

  return publicClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`
  })
}
