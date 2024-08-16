import { JsonMap } from 'store/posthog'
import { ChainId } from '@avalabs/core-chains-sdk'
import { BlockchainNamespace } from 'store/rpc/types'

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

// Based on CAIP-2, hashed
enum AvalancheChainId {
  P_CHAIN = '${BlockchainNamespace.AVAX}Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
  P_CHAIN_TESTNET = '${BlockchainNamespace.AVAX}8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl',
  X_CHAIN = '${BlockchainNamespace.AVAX}imji8papUf2EhV3le337w1vgFauqkJg-',
  X_CHAIN_TESTNET = '${BlockchainNamespace.AVAX}Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG'
}

enum BitcoinChainId {
  MAINNET = `${BlockchainNamespace.BIP122}:000000000019d6689c085ae165831e93`,
  TESTNET = `${BlockchainNamespace.BIP122}:000000000933ea01ad0ee984209779ba`
}

export const isPVMChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === AvalancheChainId.P_CHAIN ||
    caip2ChainId === AvalancheChainId.P_CHAIN_TESTNET
  )
}

export const isAVMChainId = (caip2ChainId: string): boolean => {
  return (
    caip2ChainId === AvalancheChainId.X_CHAIN ||
    caip2ChainId === AvalancheChainId.X_CHAIN_TESTNET
  )
}

export const getAvalancheCaip2ChainId = (
  chainId: number
): string | undefined => {
  if (chainId === ChainId.AVALANCHE_P) {
    return AvalancheChainId.P_CHAIN
  } else if (chainId === ChainId.AVALANCHE_TEST_P) {
    return AvalancheChainId.P_CHAIN_TESTNET
  } else if (chainId === ChainId.AVALANCHE_X) {
    return AvalancheChainId.X_CHAIN
  } else if (chainId === ChainId.AVALANCHE_TEST_X) {
    return AvalancheChainId.X_CHAIN_TESTNET
  }
  return undefined
}

export const getAvalancheChainId = (
  caip2ChainId: string
): number | undefined => {
  if (caip2ChainId === AvalancheChainId.P_CHAIN) {
    return ChainId.AVALANCHE_P
  } else if (caip2ChainId === AvalancheChainId.P_CHAIN_TESTNET) {
    return ChainId.AVALANCHE_TEST_P
  } else if (caip2ChainId === AvalancheChainId.X_CHAIN) {
    return ChainId.AVALANCHE_X
  } else if (caip2ChainId === AvalancheChainId.X_CHAIN_TESTNET) {
    return ChainId.AVALANCHE_TEST_X
  }

  return undefined
}

export const getBitcoinChainId = (caip2ChainId: string): number | undefined => {
  if (caip2ChainId === BitcoinChainId.MAINNET) {
    return ChainId.BITCOIN
  } else if (caip2ChainId === BitcoinChainId.TESTNET) {
    return ChainId.BITCOIN_TESTNET
  }

  return undefined
}

export const getBitcoinCaip2ChainId = (isMainnet: boolean): string => {
  return isMainnet ? BitcoinChainId.MAINNET : BitcoinChainId.TESTNET
}

export const getEvmCaip2ChainId = (chainId: number): string => {
  return `${BlockchainNamespace.EIP155}:${chainId.toString()}`
}

export const getChainIdFromCaip2 = (
  caip2ChainId: string
): number | undefined => {
  const namespace = caip2ChainId.split(':')[0]
  return namespace === BlockchainNamespace.AVAX
    ? getAvalancheChainId(caip2ChainId)
    : namespace === BlockchainNamespace.BIP122
    ? getBitcoinChainId(caip2ChainId)
    : Number(caip2ChainId.split(':')[1])
}
