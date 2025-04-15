import {
  AVALANCHE_XP_NETWORK,
  AVALANCHE_XP_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'

export const NETWORK_P = {
  ...AVALANCHE_XP_NETWORK,
  chainId: ChainId.AVALANCHE_P,
  isTestnet: false,
  vmName: NetworkVMType.PVM,
  chainName: 'Avalanche (P-Chain)',
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
  chainName: 'Avalanche (P-Chain)',
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
  chainName: 'Avalanche (X-Chain)',
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
  explorerUrl: 'https://subnets.avax.network/x-chain'
} as Network

export const NETWORK_X_TEST = {
  ...AVALANCHE_XP_TEST_NETWORK,
  isTestnet: true,
  chainId: ChainId.AVALANCHE_TEST_X,
  chainName: 'Avalanche (X-Chain)',
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
  explorerUrl: 'https://subnets-test.avax.network/x-chain'
} as Network
