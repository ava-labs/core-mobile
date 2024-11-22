import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import { Networks } from 'store/network/types'
import ModuleManager from 'vmModule/ModuleManager'
import NetworkService from '../NetworkService'

export function getBitcoinProvider(
  isTest: boolean | undefined
): Promise<BitcoinProvider> {
  return ModuleManager.bitcoinModule.getProvider(getBitcoinNetwork(isTest))
}

export async function getEvmProvider(
  network: Network
): Promise<JsonRpcBatchInternal> {
  if (network.vmName !== NetworkVMType.EVM)
    throw new Error(
      `Cannot get evm provider for network type: ${network.vmName}`
    )

  return ModuleManager.evmModule.getProvider(network)
}

export function getAvalancheEvmProvider(
  networks: Networks,
  isTest: boolean | undefined,
  devnet: boolean
): Promise<JsonRpcBatchInternal | undefined> {
  // TODO: https://ava-labs.atlassian.net/browse/CP-9539
  const network = getAvalancheNetwork(networks, isTest, devnet)
  if (!network) return Promise.resolve(undefined)
  return getEvmProvider(network)
}

export function getEthereumProvider(
  networks: Networks,
  isTest: boolean | undefined
): Promise<JsonRpcBatchInternal | undefined> {
  const network = getEthereumNetwork(networks, isTest)
  if (!network) return Promise.resolve(undefined)
  return getEvmProvider(network)
}

export function getAvalancheNetwork(
  networks: Networks,
  isTest: boolean | undefined,
  devnet: boolean
): Network | undefined {
  // TODO: https://ava-labs.atlassian.net/browse/CP-9539
  return devnet
    ? networks[ChainId.AVALANCHE_DEVNET_ID]
    : isTest
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

export function getAvalancheXpProvider(
  isTestnet: boolean,
  devnet: boolean
): Promise<Avalanche.JsonRpcProvider | undefined> {
  return NetworkService.getAvalancheProviderXP(isTestnet, devnet)
}
