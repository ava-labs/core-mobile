import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/chains-sdk'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { Network as EthersNetwork } from 'ethers'
import Config from 'react-native-config'
import { PollingConfig } from 'store/balance'
import { Networks } from 'store/network'
import { addGlacierAPIKeyIfNeeded } from 'utils/network/glacier'

const BLOCKCYPHER_PROXY_URL = `${Config.PROXY_URL}/proxy/blockcypher`

export function getBitcoinProvider(
  isTest: boolean | undefined
): BlockCypherProvider {
  return new BlockCypherProvider(
    !isTest,
    Config.GLACIER_API_KEY,
    BLOCKCYPHER_PROXY_URL
  )
}

export function getEvmProvider(network: Network): JsonRpcBatchInternal {
  if (network.vmName !== NetworkVMType.EVM)
    throw new Error(`Cannot get provider for network type: ${network.vmName}`)

  const multiContractAddress = network.utilityAddresses?.multicall
  const rpcUrl = network.rpcUrl
  const provider = new JsonRpcBatchInternal(
    { maxCalls: 40, multiContractAddress },
    addGlacierAPIKeyIfNeeded(rpcUrl),
    new EthersNetwork(network.chainName, network.chainId)
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
  return isTest
    ? networks[ChainId.AVALANCHE_TESTNET_ID]
    : networks[ChainId.AVALANCHE_MAINNET_ID]
}

export function getBitcoinNetwork(isTest: boolean | undefined): Network {
  return isTest ? BITCOIN_TEST_NETWORK : BITCOIN_NETWORK
}

export function getEthereumNetwork(
  networks: Networks,
  isTest: boolean | undefined
): Network | undefined {
  return isTest
    ? networks[ChainId.ETHEREUM_TEST_SEPOLIA]
    : networks[ChainId.ETHEREUM_HOMESTEAD]
}
