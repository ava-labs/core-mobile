import {
  AVALANCHE_XP_NETWORK,
  AVALANCHE_XP_TEST_NETWORK,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'

export const AVALANCHE_MAINNET_NETWORK = {
  chainId: ChainId.AVALANCHE_MAINNET_ID,
  chainName: 'Avalanche C-Chain/EVM',
  isTestnet: false,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg',
  networkToken: {
    name: 'Avalanche',
    symbol: 'AVAX',
    logoUri:
      'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg'
  },
  vmName: NetworkVMType.EVM
} as Network

export const AVALANCHE_TESTNET_NETWORK = {
  chainId: ChainId.AVALANCHE_TESTNET_ID,
  chainName: 'Avalanche C-Chain/EVM Testnet',
  isTestnet: true,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg',
  networkToken: {
    symbol: 'AVAX',
    logoUri:
      'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg'
  },
  vmName: NetworkVMType.EVM
} as Network

export const NETWORK_P = {
  ...AVALANCHE_XP_NETWORK,
  chainId: ChainId.AVALANCHE_P,
  isTestnet: false,
  vmName: NetworkVMType.PVM,
  chainName: 'Avalanche P-Chain',
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/42aMwoCLblHOklt6Msi6tm/1e64aa637a8cead39b2db96fe3225c18/pchain-square.svg',
  networkToken: {
    ...AVALANCHE_XP_NETWORK.networkToken,
    logoUri:
      'https://glacier-api.avax.network/proxy/chain-assets/cb14a1f/chains/43114/token-logo.png'
  },
  explorerUrl: 'https://subnets.avax.network/p-chain'
} as Network

export const NETWORK_P_TEST = {
  ...AVALANCHE_XP_TEST_NETWORK,
  chainId: ChainId.AVALANCHE_TEST_P,
  isTestnet: true,
  vmName: NetworkVMType.PVM,
  chainName: 'Avalanche P-Chain Testnet',
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/42aMwoCLblHOklt6Msi6tm/1e64aa637a8cead39b2db96fe3225c18/pchain-square.svg',
  networkToken: {
    ...AVALANCHE_XP_TEST_NETWORK.networkToken,
    logoUri:
      'https://glacier-api.avax.network/proxy/chain-assets/cb14a1f/chains/43114/token-logo.png'
  },
  explorerUrl: 'https://subnets-test.avax.network/p-chain'
} as Network

export const NETWORK_X = {
  ...AVALANCHE_XP_NETWORK,
  isTestnet: false,
  chainId: ChainId.AVALANCHE_X,
  chainName: 'Avalanche X-Chain',
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
  explorerUrl: 'https://subnets.avax.network/x-chain'
} as Network

export const NETWORK_X_TEST = {
  ...AVALANCHE_XP_TEST_NETWORK,
  isTestnet: true,
  chainId: ChainId.AVALANCHE_TEST_X,
  chainName: 'Avalanche X-Chain Testnet',
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
  explorerUrl: 'https://subnets-test.avax.network/x-chain'
} as Network

export const MAIN_NETWORKS = [
  AVALANCHE_MAINNET_NETWORK,
  { ...AVALANCHE_XP_NETWORK, chainName: 'Avalanche X/P-Chain' },
  BITCOIN_NETWORK
]

export const TEST_NETWORKS = [
  AVALANCHE_TESTNET_NETWORK,
  {
    ...AVALANCHE_XP_TEST_NETWORK,
    chainName: 'Avalanche X/P-Chain Testnet'
  },
  BITCOIN_TEST_NETWORK
]
