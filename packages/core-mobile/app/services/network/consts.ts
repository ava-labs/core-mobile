import {
  AVALANCHE_XP_NETWORK,
  AVALANCHE_XP_TEST_NETWORK,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'

export enum ChainName {
  AVALANCHE_X = 'Avalanche X-Chain',
  AVALANCHE_P = 'Avalanche P-Chain',
  AVALANCHE_XP = 'Avalanche X/P-Chain',
  AVALANCHE_X_TESTNET = 'Avalanche X-Chain Testnet',
  AVALANCHE_P_TESTNET = 'Avalanche P-Chain Testnet',
  AVALANCHE_XP_TESTNET = 'Avalanche X/P-Chain Testnet',
  AVALANCHE_C_EVM = 'Avalanche C-Chain/EVM',
  AVALANCHE_C_EVM_TESTNET = 'Avalanche C-Chain/EVM Testnet',
  BITCOIN = 'Bitcoin',
  BITCOIN_TESTNET = 'Bitcoin Testnet'
}

export const AVALANCHE_MAINNET_NETWORK = {
  chainId: ChainId.AVALANCHE_MAINNET_ID,
  chainName: ChainName.AVALANCHE_C_EVM,
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
  chainName: ChainName.AVALANCHE_C_EVM_TESTNET,
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
  chainName: ChainName.AVALANCHE_P,
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
  chainName: ChainName.AVALANCHE_P_TESTNET,
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
  chainName: ChainName.AVALANCHE_X,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
  explorerUrl: 'https://subnets.avax.network/x-chain'
} as Network

export const NETWORK_X_TEST = {
  ...AVALANCHE_XP_TEST_NETWORK,
  isTestnet: true,
  chainId: ChainId.AVALANCHE_TEST_X,
  chainName: ChainName.AVALANCHE_X_TESTNET,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
  explorerUrl: 'https://subnets-test.avax.network/x-chain'
} as Network

export const ETHEREUM_NETWORK = {
  chainId: 1,
  chainName: 'Ethereum',
  description: 'The primary public Ethereum blockchain network.',
  explorerUrl: 'https://etherscan.io',
  isTestnet: false,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/6l56QLVZmvacuBfjHBTThP/791d743dd2c526692562780c2325fedf/eth-circle__1_.svg',
  networkToken: {
    name: 'Ether',
    decimals: 18,
    symbol: 'ETH',
    description:
      'Ether is used to pay for transaction fees and computational services on Etherum. Users can send Ether to other users, and developers can write smart contracts that receive, hold, and send Ether.',
    logoUri:
      'https://images.ctfassets.net/gcj8jwzm6086/6l56QLVZmvacuBfjHBTThP/791d743dd2c526692562780c2325fedf/eth-circle__1_.svg'
  },
  pricingProviders: {
    coingecko: { nativeTokenId: 'ethereum', assetPlatformId: 'ethereum' }
  },
  primaryColor: '#818384',
  rpcUrl: 'https://proxy-api.avax.network/proxy/infura/mainnet',
  subnetExplorerUriId: 'ethereum',
  vmName: 'EVM',
  utilityAddresses: {
    multicall: '0x5ba1e12693dc8f9c48aad8770482f4739beed696'
  }
} as Network

export const ETHEREUM_NETWORK_TEST = {
  chainId: 11155111,
  chainName: 'Ethereum Sepolia',
  description: 'The Sepolia testnet is an Ethereum testnet.',
  explorerUrl: 'https://sepolia.etherscan.io',
  isTestnet: true,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/6l56QLVZmvacuBfjHBTThP/791d743dd2c526692562780c2325fedf/eth-circle__1_.svg',
  networkToken: {
    name: 'Ether',
    decimals: 18,
    symbol: 'ETH',
    description:
      'Ether is used to pay for transaction fees and computational services on Etherum. Users can send Ether to other users, and developers can write smart contracts that receive, hold, and send Ether.',
    logoUri:
      'https://images.ctfassets.net/gcj8jwzm6086/6l56QLVZmvacuBfjHBTThP/791d743dd2c526692562780c2325fedf/eth-circle__1_.svg'
  },
  pricingProviders: { coingecko: { nativeTokenId: 'ethereum' } },
  primaryColor: '#818384',
  rpcUrl: 'https://proxy-api.avax.network/proxy/infura/sepolia',
  subnetExplorerUriId: 'ethereum',
  vmName: 'EVM',
  utilityAddresses: { multicall: '' }
} as Network

export const MAIN_NETWORKS = [
  AVALANCHE_MAINNET_NETWORK,
  { ...AVALANCHE_XP_NETWORK, chainName: ChainName.AVALANCHE_XP },
  { ...BITCOIN_NETWORK, chainName: ChainName.BITCOIN }
]

export const TEST_NETWORKS = [
  AVALANCHE_TESTNET_NETWORK,
  {
    ...AVALANCHE_XP_TEST_NETWORK,
    chainName: ChainName.AVALANCHE_XP_TESTNET
  },
  { ...BITCOIN_TEST_NETWORK, chainName: ChainName.BITCOIN_TESTNET }
]
