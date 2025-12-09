import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network/types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import NetworkService from '../NetworkService'
import { NETWORK_SOLANA, NETWORK_SOLANA_DEVNET } from '../consts'

export function getSVMProvider(
  network?: Network
): ReturnType<typeof ModuleManager.solanaModule.getProvider> {
  if (network?.vmName !== NetworkVMType.SVM) {
    throw new Error(
      `Cannot get svm provider for network type: ${network?.vmName}`
    )
  }

  return ModuleManager.solanaModule.getProvider(mapToVmNetwork(network))
}

export function getBitcoinProvider(
  isTest: boolean | undefined
): ReturnType<typeof ModuleManager.bitcoinModule.getProvider> {
  return ModuleManager.bitcoinModule.getProvider(
    mapToVmNetwork(getBitcoinNetwork(isTest))
  )
}

export async function getEvmProvider(
  network: Network
): ReturnType<typeof ModuleManager.evmModule.getProvider> {
  if (network.vmName !== NetworkVMType.EVM)
    throw new Error(
      `Cannot get evm provider for network type: ${network.vmName}`
    )

  return ModuleManager.evmModule.getProvider(mapToVmNetwork(network))
}

export function getAvalancheEvmProvider(
  networks: Networks,
  isTest: boolean | undefined
): ReturnType<typeof getEvmProvider> | Promise<undefined> {
  const network = getAvalancheNetwork(networks, isTest)
  if (!network) return Promise.resolve(undefined)
  return getEvmProvider(network)
}

export function getEthereumProvider(
  networks: Networks,
  isTest: boolean | undefined
): ReturnType<typeof getEvmProvider> | Promise<undefined> {
  const network = getEthereumNetwork(networks, isTest)
  if (!network) return Promise.resolve(undefined)
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

export function getSolanaNetwork(
  networks: Networks,
  isTest: boolean | undefined
): Network {
  return isTest ? NETWORK_SOLANA_DEVNET : NETWORK_SOLANA
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
  isTestnet: boolean
): ReturnType<typeof NetworkService.getAvalancheProviderXP> {
  return NetworkService.getAvalancheProviderXP(isTestnet)
}
