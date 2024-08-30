import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import {
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import { Networks } from 'store/network/types'
import ModuleManager from 'vmModule/ModuleManager'

export function getBitcoinProvider(
  isTest: boolean | undefined
): BitcoinProvider {
  return ModuleManager.bitcoinModule.getProvider(getBitcoinNetwork(isTest))
}

export function getEvmProvider(network: Network): JsonRpcBatchInternal {
  if (network.vmName !== NetworkVMType.EVM)
    throw new Error(
      `Cannot get evm provider for network type: ${network.vmName}`
    )

  return ModuleManager.evmModule.getProvider(network)
}

export function getAvalancheEvmProvider(
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
