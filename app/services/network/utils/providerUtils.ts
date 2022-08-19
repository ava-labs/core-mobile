import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/chains-sdk'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import Config from 'react-native-config'
import { PollingConfig } from 'store/balance'
import { Networks } from 'store/network'
import { addGlacierAPIKeyIfNeeded, GLACIER_URL } from 'utils/glacierUtils'

const BLOCKCYPHER_PROXY_URL = `${GLACIER_URL}/proxy/blockcypher`

export function getBitcoinProvider(
  isTest: boolean | undefined
): BlockCypherProvider {
  return new BlockCypherProvider(
    !isTest,
    Config.GLACIER_API_KEY,
    BLOCKCYPHER_PROXY_URL
  )
}

export function getEvmProvider(network: Network) {
  if (network.vmName !== NetworkVMType.EVM)
    throw new Error(`Cannot get provider for network type: ${network.vmName}`)

  const multiContractAddress = network.utilityAddresses?.multicall
  const rpcUrl = network.rpcUrl
  const chainId = network.chainId
  const provider = new JsonRpcBatchInternal(
    { maxCalls: 40, multiContractAddress },
    addGlacierAPIKeyIfNeeded(rpcUrl),
    chainId
  )

  provider.pollingInterval = PollingConfig.activeNetwork

  return provider
}

export function getAvalancheProvider(
  networks: Networks,
  isTest: boolean | undefined
): JsonRpcBatchInternal | undefined {
  const network = getAvalancheNetwork(networks, isTest)
  if (!network) return
  return getEvmProvider(network)
}

export function getEthereumProvider(
  networks: Networks,
  isTest: boolean | undefined
): JsonRpcBatchInternal | undefined {
  const network = getEthereumNetwork(networks, isTest)
  if (!network) return
  return getEvmProvider(network)
}

export function getAvalancheNetwork(
  networks: Networks,
  isTest: boolean | undefined
): Network | undefined {
  const network = isTest
    ? networks[ChainId.AVALANCHE_TESTNET_ID]
    : networks[ChainId.AVALANCHE_MAINNET_ID]
  return network
}

export function getBitcoinNetwork(
  isTest: boolean | undefined
): Network | undefined {
  return isTest ? BITCOIN_TEST_NETWORK : BITCOIN_NETWORK
}

export function getEthereumNetwork(
  networks: Networks,
  isTest: boolean | undefined
): Network | undefined {
  const network = isTest
    ? networks[ChainId.ETHEREUM_TEST_GOERLY]
    : networks[ChainId.ETHEREUM_HOMESTEAD]
  return network
}
