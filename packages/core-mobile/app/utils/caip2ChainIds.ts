import { JsonMap } from 'store/posthog'
import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  BlockchainNamespace,
  ChainId,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'

/**
 * Legacy Solana chain ID format used by some WalletConnect dApps. While the standard
 * mainnet chain ID is 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', some dApps still use
 * this older format. We need to support both to maintain compatibility with all dApps.
 * This is separate from actual Solana program IDs (smart contracts) - it's just a
 * different format for identifying the Solana mainnet chain.
 */
export const SOLANA_LEGACY_CHAIN_ID = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ'

/**
 * In the process of switching to CAIP2 naming convention for blockchain ids we are temporarily modifying Posthog
 * events to send chain ids with new naming convention.
 * Eventually we will use CAIP2 through whole app so this conversion will not be needed anymore.
 * @param properties
 */
export function applyTempChainIdConversion(properties?: JsonMap): void {
  if (properties?.chainId) {
    properties.chainId = updateChainIdIfNeeded(Number(properties.chainId))
  }

  if (properties?.networkChainId) {
    properties.networkChainId = updateChainIdIfNeeded(
      Number(properties.networkChainId)
    )
  }
}

function updateChainIdIfNeeded(original: number): string {
  if (original === ChainId.AVALANCHE_P) {
    return BlockchainId.P_CHAIN
  } else if (original === ChainId.AVALANCHE_TEST_P) {
    return BlockchainId.P_CHAIN_TESTNET
  } else if (original === ChainId.AVALANCHE_X) {
    return BlockchainId.X_CHAIN
  } else if (original === ChainId.AVALANCHE_TEST_X) {
    return BlockchainId.X_CHAIN_TESTNET
  }
  return original.toString()
}

// Based on CAIP-2
enum BlockchainId {
  P_CHAIN = `${BlockchainNamespace.AVAX}:11111111111111111111111111111111LpoYY`,
  P_CHAIN_TESTNET = `${BlockchainNamespace.AVAX}:fuji-11111111111111111111111111111111LpoYY`,
  X_CHAIN = `${BlockchainNamespace.AVAX}:2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM`,
  X_CHAIN_TESTNET = `${BlockchainNamespace.AVAX}:2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm`
}

export const isPChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === AvalancheCaip2ChainId.P ||
    caip2ChainId === AvalancheCaip2ChainId.P_TESTNET
  )
}

export const isXChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === AvalancheCaip2ChainId.X ||
    caip2ChainId === AvalancheCaip2ChainId.X_TESTNET
  )
}

export const isCChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === AvalancheCaip2ChainId.C ||
    caip2ChainId === AvalancheCaip2ChainId.C_TESTNET
  )
}

export const isBtcChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === BitcoinCaip2ChainId.MAINNET ||
    caip2ChainId === BitcoinCaip2ChainId.TESTNET
  )
}

export const isSvmChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === SolanaCaip2ChainId.MAINNET ||
    caip2ChainId === SolanaCaip2ChainId.DEVNET ||
    caip2ChainId === SOLANA_LEGACY_CHAIN_ID
  )
}

export const getAvalancheCaip2ChainId = (
  chainId: number
): string | undefined => {
  if (chainId === ChainId.AVALANCHE_P) {
    return AvalancheCaip2ChainId.P
  } else if (chainId === ChainId.AVALANCHE_TEST_P) {
    return AvalancheCaip2ChainId.P_TESTNET
  } else if (chainId === ChainId.AVALANCHE_X) {
    return AvalancheCaip2ChainId.X
  } else if (chainId === ChainId.AVALANCHE_TEST_X) {
    return AvalancheCaip2ChainId.X_TESTNET
  }
  return undefined
}

export const getAvalancheChainId = (
  caip2ChainId: string
): number | undefined => {
  if (caip2ChainId === AvalancheCaip2ChainId.P) {
    return ChainId.AVALANCHE_P
  } else if (caip2ChainId === AvalancheCaip2ChainId.P_TESTNET) {
    return ChainId.AVALANCHE_TEST_P
  } else if (caip2ChainId === AvalancheCaip2ChainId.X) {
    return ChainId.AVALANCHE_X
  } else if (caip2ChainId === AvalancheCaip2ChainId.X_TESTNET) {
    return ChainId.AVALANCHE_TEST_X
  } else if (caip2ChainId === AvalancheCaip2ChainId.C) {
    return ChainId.AVALANCHE_MAINNET_ID
  } else if (caip2ChainId === AvalancheCaip2ChainId.C_TESTNET) {
    return ChainId.AVALANCHE_TESTNET_ID
  }
  return undefined
}

export const getBitcoinChainId = (caip2ChainId: string): number | undefined => {
  if (caip2ChainId === BitcoinCaip2ChainId.MAINNET) {
    return ChainId.BITCOIN
  } else if (caip2ChainId === BitcoinCaip2ChainId.TESTNET) {
    return ChainId.BITCOIN_TESTNET
  }

  return undefined
}

export const getBitcoinCaip2ChainId = (isMainnet: boolean): string => {
  return isMainnet ? BitcoinCaip2ChainId.MAINNET : BitcoinCaip2ChainId.TESTNET
}

export const getBitcoinCaip2ChainIdByChainId = (
  chainId: number
): string | undefined => {
  if (chainId === ChainId.BITCOIN) {
    return BitcoinCaip2ChainId.MAINNET
  } else if (chainId === ChainId.BITCOIN_TESTNET) {
    return BitcoinCaip2ChainId.TESTNET
  }
  return undefined
}

export const getEvmCaip2ChainId = (chainId: number): string => {
  return `${BlockchainNamespace.EIP155}:${chainId.toString()}`
}

export const getSolanaCaip2ChainId = (chainId: number): string => {
  if (chainId === ChainId.SOLANA_MAINNET_ID) {
    return SolanaCaip2ChainId.MAINNET
  } else if (chainId === ChainId.SOLANA_DEVNET_ID) {
    return SolanaCaip2ChainId.DEVNET
  } else if (chainId === ChainId.SOLANA_TESTNET_ID) {
    return SolanaCaip2ChainId.TESTNET
  }

  return `${BlockchainNamespace.SOLANA}:${chainId}`
}

export const getSolanaChainId = (caip2ChainId: string): number | undefined => {
  // First check standard formats
  if (caip2ChainId === SolanaCaip2ChainId.MAINNET) {
    return ChainId.SOLANA_MAINNET_ID
  } else if (caip2ChainId === SolanaCaip2ChainId.DEVNET) {
    return ChainId.SOLANA_DEVNET_ID
  } else if (caip2ChainId === SolanaCaip2ChainId.TESTNET) {
    return ChainId.SOLANA_TESTNET_ID
  }

  if (caip2ChainId === SOLANA_LEGACY_CHAIN_ID) {
    return ChainId.SOLANA_MAINNET_ID
  }

  return undefined
}

export const getChainIdFromCaip2 = (
  caip2ChainId: string
): number | undefined => {
  const namespace = caip2ChainId.split(':')[0]
  switch (namespace) {
    case BlockchainNamespace.AVAX:
      return getAvalancheChainId(caip2ChainId)
    case BlockchainNamespace.BIP122:
      return getBitcoinChainId(caip2ChainId)
    case BlockchainNamespace.SOLANA:
      return getSolanaChainId(caip2ChainId)
    default:
      return Number(caip2ChainId.split(':')[1])
  }
}

const AVALANCHE_CHAIN_IDS = [
  ChainId.AVALANCHE_P,
  ChainId.AVALANCHE_TEST_P,
  ChainId.AVALANCHE_X,
  ChainId.AVALANCHE_TEST_X
]

const BITCOIN_CHAIN_IDS = [ChainId.BITCOIN, ChainId.BITCOIN_TESTNET]

const SOLANA_CHAIN_IDS = [
  ChainId.SOLANA_MAINNET_ID,
  ChainId.SOLANA_DEVNET_ID,
  ChainId.SOLANA_TESTNET_ID
]

// get caip2 chain id from chain id
// if chain id is not found in the mapping, return eip155:chainId
export const getCaip2ChainId = (chainId: number): string => {
  if (AVALANCHE_CHAIN_IDS.includes(chainId)) {
    return getAvalancheCaip2ChainId(chainId) as string
  }

  if (BITCOIN_CHAIN_IDS.includes(chainId)) {
    return getBitcoinCaip2ChainIdByChainId(chainId) as string
  }

  if (SOLANA_CHAIN_IDS.includes(chainId)) {
    return getSolanaCaip2ChainId(chainId)
  }

  // Default to EVM for any other chain ID
  return getEvmCaip2ChainId(chainId)
}
