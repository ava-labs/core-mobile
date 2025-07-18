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
  AVALANCHE_C = 'Avalanche C-Chain',
  AVALANCHE_C_TESTNET = 'Avalanche C-Chain Testnet',
  BITCOIN = 'Bitcoin',
  BITCOIN_TESTNET = 'Bitcoin Testnet',
  SOLANA = 'Solana',
  SOLANA_DEVNET = 'Solana Devnet'
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

export const NETWORK_SOLANA = {
  chainId: 4503599627369476,
  chainName: 'Solana',
  description: '',
  explorerUrl: 'https://solscan.io/',
  isTestnet: false,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/4HsK06WXdGcPFQgrtZNd9t/db15a7a0726543c9c936cfbb4f41db67/solanaLogoMark.svg',
  networkToken: {
    name: 'SOL',
    decimals: 9,
    symbol: 'SOL',
    description: '',
    logoUri:
      'https://images.ctfassets.net/gcj8jwzm6086/4VgCue74mbrtME1ZqEj7Y1/44192d2d71381e89ea76f30e370ccd79/solana-sol-logo.svg'
  },
  pricingProviders: {
    coingecko: {
      nativeTokenId: 'solana',
      assetPlatformId: 'solana'
    }
  },
  primaryColor: '#9945FF',
  rpcUrl: '',
  subnetExplorerUriId: 'solana-mainnet',
  vmName: 'SVM',
  caip2Id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
} as Network

export const NETWORK_SOLANA_DEVNET = {
  chainId: 4503599627369466,
  chainName: 'Solana (Devnet)',
  description: '',
  explorerUrl: 'https://solscan.io/?cluster=devnet',
  isTestnet: true,
  logoUri:
    'https://images.ctfassets.net/gcj8jwzm6086/4HsK06WXdGcPFQgrtZNd9t/db15a7a0726543c9c936cfbb4f41db67/solanaLogoMark.svg',
  networkToken: {
    name: 'SOL',
    decimals: 9,
    symbol: 'SOL',
    description: '',
    logoUri:
      'https://images.ctfassets.net/gcj8jwzm6086/4VgCue74mbrtME1ZqEj7Y1/44192d2d71381e89ea76f30e370ccd79/solana-sol-logo.svg'
  },
  pricingProviders: {
    coingecko: {
      nativeTokenId: 'solana',
      assetPlatformId: 'solana'
    }
  },
  primaryColor: '#9945FF',
  rpcUrl: '',
  subnetExplorerUriId: 'solana-devnet',
  vmName: 'SVM',
  caip2Id: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
} as Network

// Primary networks are the ones that are always enabled in the app
export const MAIN_PRIMARY_NETWORKS = [
  AVALANCHE_MAINNET_NETWORK,
  { ...AVALANCHE_XP_NETWORK, chainName: ChainName.AVALANCHE_XP },
  { ...BITCOIN_NETWORK, chainName: ChainName.BITCOIN }
]

export const TEST_PRIMARY_NETWORKS = [
  AVALANCHE_TESTNET_NETWORK,
  {
    ...AVALANCHE_XP_TEST_NETWORK,
    chainName: ChainName.AVALANCHE_XP_TESTNET
  },
  { ...BITCOIN_TEST_NETWORK, chainName: ChainName.BITCOIN_TESTNET }
]
