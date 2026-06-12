import { ChainId, Network } from '@avalabs/core-chains-sdk'

/**
 * Short network name for the swap chip row.
 */
export const getNetworkDisplayName = (network: Network): string => {
  switch (network.chainId) {
    case ChainId.AVALANCHE_MAINNET_ID:
      return 'C-Chain'
    case ChainId.AVALANCHE_TESTNET_ID:
      return 'C-Chain Testnet'
    case ChainId.AVALANCHE_P:
      return 'P-Chain'
    case ChainId.AVALANCHE_TEST_P:
      return 'P-Chain Testnet'
    case ChainId.AVALANCHE_X:
      return 'X-Chain'
    case ChainId.AVALANCHE_TEST_X:
      return 'X-Chain Testnet'
    case ChainId.SOLANA_MAINNET_ID:
      return 'Solana'
    default:
      return network.chainName
  }
}

/**
 * Long network name for descriptive subtitles like "on Avalanche (C-Chain)".
 * The Avalanche Primary Network chains share the "Avalanche" prefix so users
 * can tell C/P/X belong to the same family.
 */
export const getNetworkLongDisplayName = (network: Network): string => {
  switch (network.chainId) {
    case ChainId.AVALANCHE_MAINNET_ID:
      return 'Avalanche (C-Chain)'
    case ChainId.AVALANCHE_TESTNET_ID:
      return 'Avalanche (C-Chain Testnet)'
    case ChainId.AVALANCHE_P:
      return 'Avalanche (P-Chain)'
    case ChainId.AVALANCHE_TEST_P:
      return 'Avalanche (P-Chain Testnet)'
    case ChainId.AVALANCHE_X:
      return 'Avalanche (X-Chain)'
    case ChainId.AVALANCHE_TEST_X:
      return 'Avalanche (X-Chain Testnet)'
    default:
      return network.chainName
  }
}
